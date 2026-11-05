import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 3120,
    strictPort: true,
    fs: {
      allow: [path.resolve(rootDir, "../..")],
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 3120,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    modulePreload: { polyfill: false },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@sprint-stats-types": path.resolve(
        rootDir,
        "../../src/model/sprint-stats.ts",
      ),
    },
  },
});
