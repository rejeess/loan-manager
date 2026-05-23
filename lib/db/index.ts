import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";

const url = process.env.DATABASE_URL ?? "./db/loan-manager.db";

const client = createClient({
  url: url.startsWith("file:") || url.startsWith("libsql:") || url.startsWith("http")
    ? url
    : `file:${url}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
