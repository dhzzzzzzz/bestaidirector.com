CREATE OR REPLACE VIEW public.public_comments
WITH (security_invoker = on, security_barrier = true) AS
SELECT
  c.id,
  c.tool_id,
  c.content,
  c.rating,
  c.created_at,
  c.updated_at,
  c.guest_name,
  c.content_en,
  c.content_ja,
  c.content_ko,
  COALESCE(NULLIF(c.guest_name, ''), 'user') AS author_name,
  NULL::text AS author_avatar_url
FROM public.comments AS c;

CREATE POLICY "Comments are viewable by everyone"
ON public.comments
FOR SELECT
TO public
USING (true);

GRANT SELECT (id, tool_id, content, rating, created_at, updated_at, guest_name, content_en, content_ja, content_ko)
ON public.comments TO anon;