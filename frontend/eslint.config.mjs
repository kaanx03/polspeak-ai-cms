import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Legacy lesson editor and presenter (thousands of lines each). They are split into
    // typed per-module components in the ROADMAP step "Frontend wiring + editor split";
    // until then their remaining `any` types and `module` variables are reported as warnings.
    files: ["src/app/lessons/**/edit/page.tsx", "src/app/lessons/**/present/page.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-assign-module-variable": "warn",
    },
  },
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
