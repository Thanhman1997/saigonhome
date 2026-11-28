import path from "node:path"
import { defineConfig } from "vitest/config"

const rootDir = process.cwd()

export default defineConfig({
  resolve: { alias: { "@": path.resolve(rootDir, ".") } },
  test: {
    environment: "node",
    exclude: ["node_modules/**", "tests/e2e/**", "playwright.config.ts"],
  },
})
