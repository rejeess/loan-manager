import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | undefined;

function getInstance(): DB {
  if (!_db) {
    const url = process.env.DATABASE_URL ?? "./db/loan-manager.db";
    const client = createClient({
      url: url.startsWith("file:") || url.startsWith("libsql:") || url.startsWith("http")
        ? url
        : `file:${url}`,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

// Lazy proxy — defers createClient() to first request so build-time imports don't open the DB file
export const db: DB = new Proxy({} as DB, {
  get(_target, prop: string | symbol) {
    return getInstance()[prop as keyof DB];
  },
});
