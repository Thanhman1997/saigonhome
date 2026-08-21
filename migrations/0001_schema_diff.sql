-- Review-only migration for schema differences found on 2026-08-22.
-- This file has NOT been executed against production.
--
-- Production already contains the application tables and booking start_at/end_at
-- columns. The remaining code/schema difference is the lookup index below.
-- The statement is idempotent and does not modify or remove rows.

CREATE INDEX IF NOT EXISTS idx_therapist_areas_lookup
  ON therapist_service_areas (therapist_id, service_area_id);
