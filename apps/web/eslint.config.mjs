import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {import("eslint").Linter.Config[]} */
const nextConfigs = [
  ...require("eslint-config-next/core-web-vitals"),
  ...require("eslint-config-next/typescript"),
];

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  ...nextConfigs,
];

export default eslintConfig;
