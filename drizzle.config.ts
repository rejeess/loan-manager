import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url: `file:${process.env.DATABASE_URL ?? "./db/loan-manager.db"}`,
  },
});
