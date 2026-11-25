-- Track reply email delivery separately from the admin's answer. Additive and idempotent.
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS reply_email_status text NOT NULL DEFAULT 'not_sent';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS reply_email_sent_at timestamptz;

-- Questions already answered before this column existed were emailed by the old flow.
UPDATE public.questions
SET reply_email_status = 'sent', reply_email_sent_at = replied_at
WHERE reply IS NOT NULL AND reply_email_status = 'not_sent';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_reply_email_status_check') THEN
    ALTER TABLE public.questions ADD CONSTRAINT questions_reply_email_status_check
      CHECK (reply_email_status IN ('not_sent', 'sent', 'failed'));
  END IF;
END $$;
