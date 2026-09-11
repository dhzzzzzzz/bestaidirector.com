DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
ON public.comments
FOR SELECT
TO anon
USING (true);

GRANT SELECT ON public.comments TO authenticated;
GRANT SELECT (id, tool_id, content, rating, created_at, updated_at, guest_name, content_en, content_ja, content_ko)
ON public.comments TO anon;

GRANT SELECT ON public.profiles TO authenticated;