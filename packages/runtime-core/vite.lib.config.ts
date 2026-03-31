import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*.ts"],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(root, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.mjs",
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
