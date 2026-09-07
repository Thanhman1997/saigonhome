import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error("Database configuration is missing: set POSTGRES_URL or DATABASE_URL.")
}

export const pool = new Pool({ connectionString })
export const db = drizzle(pool, { schema })
