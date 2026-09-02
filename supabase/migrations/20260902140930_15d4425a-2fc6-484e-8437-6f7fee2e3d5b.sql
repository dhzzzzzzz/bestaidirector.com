ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_ja text,
  ADD COLUMN IF NOT EXISTS name_ko text;

ALTER TABLE public.ai_news
  ADD COLUMN IF NOT EXISTS source_en text,
  ADD COLUMN IF NOT EXISTS source_ja text,
  ADD COLUMN IF NOT EXISTS source_ko text;