const reactHooks = require("eslint-plugin-react-hooks");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["dist", "node_modules"]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  prettier
];
