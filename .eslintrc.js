/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ["@acme/eslint-config"], // uses the config in `packages/config/eslint`
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    tsconfigRootDir: __dirname,
    project: true,
  },
  settings: {
    next: {
      rootDir: ["apps/nextjs"],
    },
    electron: {
      rootDir: ["apps/electron"],
    },
  },
  rules: {
    "@next/next/no-img-element": "off",
  },
};

module.exports = config;
