import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
  },
});
