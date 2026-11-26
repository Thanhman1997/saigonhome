-- Database integrity hardening. Idempotent: safe to run more than once.
-- Run against Neon after taking a branch/backup. Foreign keys are added NOT VALID so
-- legacy orphan rows do not block the migration; run the VALIDATE statements once clean.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_service_id_fkey') THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_therapist_id_fkey') THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_therapist_id_fkey
      FOREIGN KEY (therapist_id) REFERENCES public.therapists(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_booking_id_fkey') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_booking_id_fkey
      FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_therapist_id_fkey') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_therapist_id_fkey
      FOREIGN KEY (therapist_id) REFERENCES public.therapists(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_durations_service_id_fkey') THEN
    ALTER TABLE public.service_durations ADD CONSTRAINT service_durations_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

-- Check constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_rating_range') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_guests_range') THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_guests_range CHECK (guests BETWEEN 1 AND 10) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_time_order') THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_time_order CHECK (end_at > start_at) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_amounts_nonnegative') THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_amounts_nonnegative
      CHECK (subtotal_vnd >= 0 AND discount_vnd >= 0 AND total_vnd >= 0) NOT VALID;
  END IF;
END $$;

-- One review per booking. Skipped with a notice if duplicates already exist.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.reviews WHERE booking_id IS NOT NULL GROUP BY booking_id HAVING count(*) > 1) THEN
    RAISE NOTICE 'reviews_booking_id_key skipped: duplicate reviews exist per booking. Resolve them, then re-run.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_id_key ON public.reviews (booking_id) WHERE booking_id IS NOT NULL;
  END IF;
END $$;

-- A named therapist can never hold two active bookings that overlap. Skipped with a notice if
-- existing data already overlaps. start_at/end_at are timestamptz (absolute instants; the venue
-- timezone is Asia/Ho_Chi_Minh, applied only when converting the local date/time columns).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_therapist_no_overlap') THEN
    BEGIN
      ALTER TABLE public.bookings ADD CONSTRAINT bookings_therapist_no_overlap
        EXCLUDE USING gist (therapist_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&)
        WHERE (therapist_id IS NOT NULL AND status IN ('pending', 'confirmed'));
    EXCEPTION WHEN exclusion_violation THEN
      RAISE NOTICE 'bookings_therapist_no_overlap skipped: overlapping active bookings already exist.';
    END;
  END IF;
END $$;

-- Query indexes
CREATE INDEX IF NOT EXISTS bookings_status_start_idx ON public.bookings (status, start_at);
CREATE INDEX IF NOT EXISTS bookings_therapist_start_idx ON public.bookings (therapist_id, start_at);
CREATE INDEX IF NOT EXISTS reviews_approved_date_idx ON public.reviews (approved, review_date DESC);

-- Applied to production 2026-11-25: start_at/end_at converted to timestamptz (6 legacy rows normalized
-- from date/time minus 7h) and all NOT VALID constraints validated. Kept for reference:
-- ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_service_id_fkey;
-- ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_therapist_id_fkey;
-- ALTER TABLE public.reviews VALIDATE CONSTRAINT reviews_booking_id_fkey;
-- ALTER TABLE public.reviews VALIDATE CONSTRAINT reviews_therapist_id_fkey;
-- ALTER TABLE public.service_durations VALIDATE CONSTRAINT service_durations_service_id_fkey;
