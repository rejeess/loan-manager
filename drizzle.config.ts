import { defineConfig } from "drizzle-kit";

const rawUrl = process.env.DATABASE_URL ?? "./db/loan-manager.db";
const url =
  rawUrl.startsWith("libsql:") || rawUrl.startsWith("http")
    ? rawUrl
    : `file:${rawUrl}`;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
