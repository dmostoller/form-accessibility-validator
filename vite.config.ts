import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "src/popup/index.tsx"),
        content: path.resolve(__dirname, "src/content/content.ts"),
        background: path.resolve(__dirname, "src/background/background.ts"),
      },
      output: {
        format: "es",
        entryFileNames: (chunk) => `${chunk.name}.js`,
        chunkFileNames: "[name].[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const extType = info[info.length - 1];
          if (extType === "css") {
            return "styles.css";
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    outDir: "dist",
    sourcemap: true,
  },
  publicDir: "public",
});
