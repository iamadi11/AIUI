import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/**/*.tsx", "src/**/*.ts"],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(root, "src/index.tsx"),
      formats: ["es"],
      fileName: () => "index.mjs",
    },
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@aiui/runtime-core",
      ],
    },
  },
});
