DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

REVOKE SELECT ON public.comments FROM anon, authenticated;
GRANT SELECT (id, tool_id, content, rating, created_at, updated_at, guest_name, content_en, content_ja, content_ko)
ON public.comments TO anon, authenticated;

GRANT SELECT ON public.public_comments TO anon, authenticated;