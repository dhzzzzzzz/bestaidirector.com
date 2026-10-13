ALTER TABLE public.ai_news ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

CREATE TABLE public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.ai_news(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX news_comments_news_idx ON public.news_comments(news_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_comments TO authenticated;
GRANT ALL ON public.news_comments TO service_role;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own news comments" ON public.news_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own news comments" ON public.news_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own news comments" ON public.news_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own news comments" ON public.news_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_news_comments(_news_id uuid)
RETURNS TABLE(id uuid, content text, rating integer, created_at timestamptz, author_name text, is_own boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.id, c.content, c.rating, c.created_at, p.username,
         (c.user_id = auth.uid())
  FROM public.news_comments c LEFT JOIN public.profiles p ON p.user_id = c.user_id
  WHERE c.news_id = _news_id ORDER BY c.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.get_news_comments(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.recalc_news_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE target uuid := COALESCE(NEW.news_id, OLD.news_id);
BEGIN
  UPDATE public.ai_news n SET rating_avg = COALESCE(a.av,0), rating_count = COALESCE(a.cnt,0)
  FROM (SELECT AVG(rating)::numeric(3,2) av, COUNT(*) cnt FROM public.news_comments WHERE news_id = target) a
  WHERE n.id = target;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.recalc_news_rating() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER news_comments_recalc AFTER INSERT OR UPDATE OR DELETE ON public.news_comments FOR EACH ROW EXECUTE FUNCTION public.recalc_news_rating();
CREATE TRIGGER update_news_comments_updated_at BEFORE UPDATE ON public.news_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();