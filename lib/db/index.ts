import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error("Database configuration is missing: set POSTGRES_URL or DATABASE_URL.")
}

const normalizedConnectionString = connectionString.replace(/([?&]sslmode=)require\b/, "$1verify-full")

// Hot reloads re-evaluate this module; keeping the pool on globalThis stops each reload from leaking a new set of connections.
const globalForPool = globalThis as unknown as { __lotusPgPool?: Pool }

export const pool =
  globalForPool.__lotusPgPool ??
  new Pool({ connectionString: normalizedConnectionString, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 })

globalForPool.__lotusPgPool = pool

export const db = drizzle(pool, { schema })
