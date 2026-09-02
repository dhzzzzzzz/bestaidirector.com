ALTER TABLE public.ai_news
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS title_ja text,
  ADD COLUMN IF NOT EXISTS title_ko text,
  ADD COLUMN IF NOT EXISTS summary_en text,
  ADD COLUMN IF NOT EXISTS summary_ja text,
  ADD COLUMN IF NOT EXISTS summary_ko text;