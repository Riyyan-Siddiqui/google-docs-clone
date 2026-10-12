import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds a self-contained preview.html using in-memory mock data (no backend).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: { "import.meta.env.VITE_MOCK": JSON.stringify("1") },
  build: { outDir: "dist-preview", emptyOutDir: true },
});
