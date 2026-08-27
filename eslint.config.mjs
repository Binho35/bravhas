import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const legacyClientFiles = [
  "app/financeiro/**/*.tsx",
  "app/obrigacoes/**/*.tsx",
  "app/page.tsx",
  "modules/auth/**/*.ts",
  "modules/auth/**/*.tsx",
  "modules/financial/hooks/**/*.ts",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: legacyClientFiles,
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
