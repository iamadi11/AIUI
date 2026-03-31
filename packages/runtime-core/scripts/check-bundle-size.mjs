import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const mjs = join(root, "..", "dist", "index.mjs");
const js = join(root, "..", "dist", "index.js");
const bundle = existsSync(mjs) ? mjs : js;
/** Soft ceiling for the ESM bundle (adjust when intentionally growing the runtime). */
const maxBytes = 900 * 1024;

const size = readFileSync(bundle).length;
const kb = (size / 1024).toFixed(1);
console.log(`@aiui/runtime-core ${bundle.replace(/.*\//, "")}: ${kb} KiB (budget ≤ ${maxBytes / 1024} KiB)`);

if (size > maxBytes) {
  console.error(
    `Bundle size ${size} bytes exceeds budget ${maxBytes} bytes. Raise the budget in check-bundle-size.mjs only if the growth is intentional.`,
  );
  process.exit(1);
}
