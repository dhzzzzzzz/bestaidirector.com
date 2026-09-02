-- 1. Public read of comments
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
ON public.comments FOR SELECT
USING (true);
GRANT SELECT ON public.comments TO anon;

-- 2. Public display profile view (only username/avatar)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT user_id, username, avatar_url FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Rating aggregation
CREATE OR REPLACE FUNCTION public.recalc_tool_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid := COALESCE(NEW.tool_id, OLD.tool_id);
BEGIN
  UPDATE public.ai_tools t
  SET rating_avg = COALESCE(agg.avg_rating, 0),
      rating_count = COALESCE(agg.cnt, 0)
  FROM (
    SELECT AVG(rating)::numeric(3,2) AS avg_rating, COUNT(rating) AS cnt
    FROM public.comments
    WHERE tool_id = target AND rating IS NOT NULL
  ) agg
  WHERE t.id = target;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS comments_recalc_rating ON public.comments;
CREATE TRIGGER comments_recalc_rating
AFTER INSERT OR UPDATE OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.recalc_tool_rating();