-- Adds the payment confirmation timestamp used by the booking insert and admin payment confirmation.
-- Idempotent: safe to run more than once.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;
