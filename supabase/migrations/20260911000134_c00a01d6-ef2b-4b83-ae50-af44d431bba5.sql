DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can view their own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can view all comments" ON public.comments;

CREATE POLICY "Users can view their own comments"
ON public.comments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all comments"
ON public.comments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE SELECT ON public.comments FROM anon;

CREATE OR REPLACE VIEW public.public_comments
WITH (security_invoker = off, security_barrier = true) AS
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
  COALESCE(NULLIF(p.username, ''), NULLIF(c.guest_name, ''), 'user') AS author_name,
  p.avatar_url AS author_avatar_url
FROM public.comments AS c
LEFT JOIN public.profiles AS p ON p.user_id = c.user_id;

REVOKE ALL ON public.public_comments FROM PUBLIC;
GRANT SELECT ON public.public_comments TO anon, authenticated;

DROP POLICY IF EXISTS "Public display info is viewable by everyone" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;