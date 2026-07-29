import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5173,
    // Same-origin API in dev, like nginx does in Docker.
    proxy: { "/api": "http://localhost:3000", "/health": "http://localhost:3000" },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/modules/**", "src/components/**", "src/hooks/**"],
      exclude: ["**/test/**", "**/*.test.{ts,tsx}", "**/factory.ts", "src/components/ui/**"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
