-- Adds one-time email confirmation credentials and the confirmation timestamp.
-- Additive and idempotent; existing booking rows remain unchanged.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmation_token_hash text,
  ADD COLUMN IF NOT EXISTS confirmation_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_confirmation_token_hash_key
  ON public.bookings (confirmation_token_hash);
