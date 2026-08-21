import pg from "pg"

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
const confirmation = process.env.E2E_CLEANUP_CONFIRM

if (!databaseUrl || confirmation !== "saigon-home-e2e" || !databaseUrl.includes("ep-shiny-shape-awmocejt")) {
  throw new Error(
    "Refusing cleanup: set E2E_CLEANUP_CONFIRM=saigon-home-e2e and use the isolated Neon E2E branch URL.",
  )
}

const pool = new Pool({ connectionString: databaseUrl })

try {
  await pool.query("BEGIN")
  await pool.query("DELETE FROM bookings WHERE reference LIKE 'E2E-%' OR email LIKE 'e2e-%'")
  await pool.query("DELETE FROM customers WHERE email LIKE 'e2e-%'")
  await pool.query("DELETE FROM therapist_service_areas WHERE therapist_id IN (SELECT id FROM therapists WHERE code = 'E2E-THERAPIST')")
  await pool.query("DELETE FROM therapist_working_hours WHERE therapist_id IN (SELECT id FROM therapists WHERE code = 'E2E-THERAPIST')")
  await pool.query("DELETE FROM therapist_days_off WHERE therapist_id IN (SELECT id FROM therapists WHERE code = 'E2E-THERAPIST')")
  await pool.query("DELETE FROM therapists WHERE code = 'E2E-THERAPIST'")
  await pool.query("DELETE FROM service_durations WHERE service_id IN (SELECT id FROM services WHERE slug = 'e2e-test-massage')")
  await pool.query("DELETE FROM services WHERE slug = 'e2e-test-massage'")
  await pool.query("DELETE FROM therapist_service_areas WHERE service_area_id IN (SELECT id FROM service_areas WHERE name_en = 'E2E Test Area')")
  await pool.query("DELETE FROM service_areas WHERE name_en = 'E2E Test Area'")
  await pool.query("COMMIT")
  console.log("E2E cleanup completed on the isolated branch.")
} catch (error) {
  await pool.query("ROLLBACK")
  throw error
} finally {
  await pool.end()
}
