import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const rawConnectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL

// pg 8.22 treats `sslmode=require` as an alias for `verify-full`. Normalize it
// explicitly so connection behavior remains stable across driver upgrades.
const connectionString = rawConnectionString?.replace(
  /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i,
  "$1sslmode=verify-full",
)

// Keep module initialization build-safe; the deployed runtime supplies the
// connection string through the project environment.
export const pool = new Pool({
  connectionString: connectionString ?? "postgresql://127.0.0.1:5432/postgres",
})
export const db = drizzle(pool, { schema })
