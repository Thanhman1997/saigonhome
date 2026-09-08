import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error("Database configuration is missing: set POSTGRES_URL or DATABASE_URL.")
}

const normalizedConnectionString = connectionString.replace(/([?&]sslmode=)require\b/, "$1verify-full")

export const pool = new Pool({ connectionString: normalizedConnectionString })
export const db = drizzle(pool, { schema })
