import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // Apenas regras para organizar imports
      "unused-imports/no-unused-imports": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // Desabilitar todas as outras regras para focar apenas nos imports
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "no-debugger": "off",
      "no-alert": "off",
      "no-var": "off",
      "prefer-const": "off",
      "no-useless-catch": "off",
      "no-empty": "off",
      "no-case-declarations": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-refresh/only-export-components": "off",
      "no-useless-escape": "off",
    },
  },
);
