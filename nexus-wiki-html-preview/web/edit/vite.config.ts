import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  base: "./",
  server: {
    port: 3101,
    fs: { allow: [appRoot] },
  },
  build: { outDir: "dist" },
  plugins: [react()],
});
