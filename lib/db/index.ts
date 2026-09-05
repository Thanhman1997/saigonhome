import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL

// Keep module initialization build-safe; the deployed runtime supplies the
// connection string through the project environment.
export const pool = new Pool({
  connectionString: connectionString ?? "postgresql://127.0.0.1:5432/postgres",
})
export const db = drizzle(pool, { schema })
