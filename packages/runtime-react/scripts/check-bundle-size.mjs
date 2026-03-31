import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const mjs = join(root, "..", "dist", "index.mjs");
const js = join(root, "..", "dist", "index.js");
const bundle = existsSync(mjs) ? mjs : js;
/** Adapter stays thin: peers supply React and `@aiui/runtime-core`. */
const maxBytes = 48 * 1024;

const size = readFileSync(bundle).length;
const kb = (size / 1024).toFixed(1);
console.log(`@aiui/runtime-react ${bundle.replace(/.*\//, "")}: ${kb} KiB (budget ≤ ${maxBytes / 1024} KiB)`);

if (size > maxBytes) {
  console.error(
    `Bundle size ${size} bytes exceeds budget ${maxBytes} bytes. Raise the budget in check-bundle-size.mjs only if the growth is intentional.`,
  );
  process.exit(1);
}
