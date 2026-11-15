import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ─── Import boundaries ─────────────────────────────────────────────────────
// docs/architecture/overview.md 의 의존 규칙을 강제한다.
// no-restricted-imports 는 파일마다 마지막으로 매칭된 설정 하나만 적용되므로
// 각 영역의 규칙 묶음을 완전한 목록으로 만든다.

/** FSD layers from top to bottom. A layer may import only layers below it. */
const FSD_LAYERS = ["views", "widgets", "features", "entities", "shared"];
const SLICED_LAYERS = ["views", "widgets", "features", "entities"];

const NO_BACKEND = [
  {
    group: ["@server", "@server/*"],
    message: "FE는 BE를 직접 import하지 않습니다. src/shared/api/client.ts(apiRequest)로 호출하세요.",
  },
  {
    regex: "^(\\.\\./)+server(/|$)",
    message: "FE는 BE를 직접 import하지 않습니다. src/shared/api/client.ts(apiRequest)로 호출하세요.",
  },
  {
    group: ["@supabase/*"],
    message: "DB·인증은 BE 담당입니다. FE는 Supabase를 직접 쓰지 않습니다.",
  },
];

const PUBLIC_API_ONLY = {
  group: [
    ...SLICED_LAYERS.map((layer) => `@/${layer}/*/*`),
    "!@/entities/*/server",
    "!@/features/*/server",
    "!@/widgets/*/server",
  ],
  message: "슬라이스는 공개 API(index.ts 또는 server.ts)로만 import합니다.",
};

function fsdLayerPatterns(layer) {
  const index = FSD_LAYERS.indexOf(layer);
  const higher = FSD_LAYERS.slice(0, index);
  const patterns = [...NO_BACKEND, PUBLIC_API_ONLY];
  if (higher.length > 0) {
    patterns.push({
      group: higher.flatMap((name) => [`@/${name}`, `@/${name}/*`]),
      message: `FSD: ${layer} 레이어는 상위 레이어(${higher.join(", ")})를 import할 수 없습니다.`,
    });
  }
  if (SLICED_LAYERS.includes(layer)) {
    patterns.push({
      group: [`@/${layer}/*`],
      message: `FSD: 같은 레이어(${layer})의 다른 슬라이스는 import할 수 없습니다. 슬라이스 내부는 상대 경로를 쓰세요.`,
    });
  }
  return patterns;
}

const boundaries = [
  // FE — FSD layers
  ...FSD_LAYERS.map((layer) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: { "no-restricted-imports": ["error", { patterns: fsdLayerPatterns(layer) }] },
  })),
  // FE — Next routing (FSD app layer) and proxy
  {
    files: ["app/**/*.{ts,tsx}", "proxy.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: [...NO_BACKEND, PUBLIC_API_ONLY] }] },
  },
  // The two places allowed to reach the BE: the HTTP mount and the FE's backend transport.
  {
    files: ["app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@server/*"], message: "BE는 공개 진입점(@server)으로만 import합니다." },
            { group: ["@/*"], message: "API 마운트는 FE 코드를 import하지 않습니다." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/api/backend.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@server/*"], message: "BE는 공개 진입점(@server)으로만 import합니다." }] },
      ],
    },
  },
  // BE — framework-agnostic: no FE, no Next.js, no React
  {
    files: ["server/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/*"], message: "BE는 FE 코드를 import하지 않습니다." },
            { regex: "^(\\.\\./)+(src|app)(/|$)", message: "BE는 FE 코드를 import하지 않습니다." },
            {
              group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*", "server-only"],
              message: "BE는 Next.js·React에 의존하지 않습니다 (분리 가능해야 함). 웹 표준 Request/Response만 씁니다.",
            },
          ],
        },
      ],
    },
  },
  // Contracts — shared by both sides, so depend on neither
  {
    files: ["contracts/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "@server", "@server/*", "@supabase/*", "next", "next/*", "react", "react/*"],
              message: "contracts는 FE·BE·프레임워크 어디에도 의존하지 않습니다 (zod만 허용).",
            },
            { regex: "^(\\.\\./)+(src|app|server)(/|$)", message: "contracts는 FE·BE를 import하지 않습니다." },
          ],
        },
      ],
    },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaries,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
