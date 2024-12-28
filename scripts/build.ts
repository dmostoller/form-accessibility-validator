import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs-extra";
import { build as viteBuild } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
  const rootDir = resolve(__dirname, "..");
  const distDir = resolve(rootDir, "dist");
  const publicDir = resolve(rootDir, "public");
  const srcDir = resolve(rootDir, "src");

  // Create dist directory if it doesn't exist
  await fs.ensureDir(distDir);
  await fs.emptyDir(distDir);

  await viteBuild();

  // Copy manifest from public directory
  await fs.copy(
    resolve(publicDir, "manifest.json"),
    resolve(distDir, "manifest.json"),
  );

  await fs.copy(resolve(publicDir, "popup"), resolve(distDir, "popup"));

  // Copy icons
  const iconsDir = resolve(publicDir, "icons");
  if (await fs.pathExists(iconsDir)) {
    await fs.copy(iconsDir, resolve(distDir, "icons"));
  }
}

build().catch(console.error);
