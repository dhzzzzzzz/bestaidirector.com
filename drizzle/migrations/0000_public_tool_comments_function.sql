CREATE OR REPLACE FUNCTION public.get_tool_comments(_tool_id uuid)
RETURNS TABLE (
  id uuid,
  tool_id uuid,
  content text,
  content_en text,
  content_ja text,
  content_ko text,
  rating integer,
  created_at timestamptz,
  updated_at timestamptz,
  guest_name text,
  author_name text,
  author_avatar_url text,
  is_own boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.tool_id, c.content, c.content_en, c.content_ja, c.content_ko,
         c.rating, c.created_at, c.updated_at, c.guest_name,
         COALESCE(NULLIF(c.guest_name, ''), p.username) AS author_name,
         p.avatar_url AS author_avatar_url,
         (c.user_id IS NOT NULL AND c.user_id = auth.uid()) AS is_own
  FROM public.comments c
  LEFT JOIN public.profiles p ON p.user_id = c.user_id
  WHERE c.tool_id = _tool_id
  ORDER BY c.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.get_tool_comments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tool_comments(uuid) TO anon, authenticated, service_role;