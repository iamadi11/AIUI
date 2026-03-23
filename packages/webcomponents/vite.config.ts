import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@dynaui/core": path.resolve(__dirname, "../core/dist/index.js"),
      "@dynaui/react": path.resolve(__dirname, "../react/src/index.ts"),
      "@dynaui/ui": path.resolve(__dirname, "../ui/src/index.ts"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/register.tsx"),
      name: "DynaUIWC",
      formats: ["es", "iife"],
      fileName: (format) =>
        format === "es" ? "dynaui-wc.esm.js" : "dynaui-wc.iife.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "dynaui-wc.[ext]",
      },
    },
    emptyOutDir: true,
  },
});
