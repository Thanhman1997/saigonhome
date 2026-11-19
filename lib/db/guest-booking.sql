ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS locale text CHECK (locale IN ('en', 'vi', 'ko')),
  ADD COLUMN IF NOT EXISTS access_token_hash text UNIQUE,
  ADD COLUMN IF NOT EXISTS access_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_token_revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS submission_key uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
