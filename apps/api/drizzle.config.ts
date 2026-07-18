import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/modules/shared/infrastructure/outboxSchema.ts",
    "./src/modules/identity/schema.ts",
    "./src/modules/library/infrastructure/trackSchema.ts",
    "./src/modules/separation/infrastructure/jobSchema.ts",
  ],
  out: "./drizzle",
});
