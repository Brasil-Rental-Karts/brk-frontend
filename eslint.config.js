import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettierConfig,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier: prettier,
      "unused-imports": unusedImports,
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Regras para variáveis não utilizadas
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off", // Desabilita a regra do ESLint base em favor da do TypeScript
      "prettier/prettier": "error",
      // Regras para remover imports não utilizados automaticamente
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Organização e agrupamento de imports
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/order": "off",
      // Regras adicionais para limpeza de código
      "no-console": ["warn", { allow: ["error"] }], // Permite apenas console.error
      "no-debugger": "error", // Erro para debugger
      "no-alert": "warn", // Avisa sobre alert
      "no-var": "error", // Força uso de const/let
      "prefer-const": "error", // Força uso de const quando possível
    },
  },
);
