import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/shared/infrastructure/outbox.ts",
    "./src/modules/library/infrastructure/schema.ts",
    "./src/modules/separation/infrastructure/schema.ts",
  ],
  out: "./drizzle",
});
