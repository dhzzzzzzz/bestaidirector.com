CREATE TABLE IF NOT EXISTS public.tag_translations (
  tag text PRIMARY KEY,
  en text,
  ja text,
  ko text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tag_translations TO anon;
GRANT SELECT ON public.tag_translations TO authenticated;
GRANT ALL ON public.tag_translations TO service_role;
ALTER TABLE public.tag_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tag translations are public" ON public.tag_translations FOR SELECT USING (true);
INSERT INTO public.tag_translations (tag)
SELECT DISTINCT unnest(tags) FROM public.ai_tools
ON CONFLICT DO NOTHING;