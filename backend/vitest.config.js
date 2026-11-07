import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "..",
  test: {
    environment: "jsdom",
    include: [
      "frontend/Application/**/*.test.js",
      "backend/tests/**/*.test.js"
    ],
    coverage: {
      provider: "v8",
      include: [
        "frontend/Application/scripts/**/*.js",
        "backend/src/**/*.js"
      ],
      exclude: [
        "**/*.test.js"
      ],
      reportsDirectory: "backend/coverage"
    }
  }
});
