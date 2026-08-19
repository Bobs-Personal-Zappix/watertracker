const globals = require("globals");

// Bundle-only no-undef sweep. Deliberately minimal — no style rules, no build step.
// See CLAUDE.md: never regenerate site/app/bundle.js from src/; this only checks it.
module.exports = [
  {
    files: ["site/app/bundle.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "error",
    },
  },
];
