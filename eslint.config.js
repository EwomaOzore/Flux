// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "**/__tests__/**"],
  },
  {
    rules: {
      // eslint-plugin-react-hooks 7 (via eslint-config-expo 57)
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
