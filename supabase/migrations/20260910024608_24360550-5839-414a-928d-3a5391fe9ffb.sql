ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content_en text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content_ja text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content_ko text;