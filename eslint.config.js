import js from "@eslint/js";
import { fileURLToPath } from "node:url";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

export default tseslint.config(
  {
    ignores: ["coverage", "dist", "node_modules"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      sonarjs,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "sonarjs/cognitive-complexity": ["error", 25],
      "sonarjs/cyclomatic-complexity": ["error", { threshold: 20 }],
      "sonarjs/no-identical-expressions": "error",
      "sonarjs/no-small-switch": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/prefer-read-only-props": "off",
    },
  },
  {
    files: ["src/App.tsx"],
    rules: {
      "sonarjs/cognitive-complexity": ["error", 40],
      "sonarjs/cyclomatic-complexity": ["error", { threshold: 45 }],
    },
  },
  {
    files: ["src/settings.ts"],
    rules: {
      "sonarjs/cognitive-complexity": ["error", 60],
      "sonarjs/cyclomatic-complexity": ["error", { threshold: 70 }],
    },
  },
  {
    files: ["src/projection.ts", "src/RetirementIncomeBridgeChart.tsx"],
    rules: {
      "sonarjs/cyclomatic-complexity": ["error", { threshold: 35 }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
    rules: {
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/cyclomatic-complexity": "off",
    },
  },
);
