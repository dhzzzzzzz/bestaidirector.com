CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT user_id, username, avatar_url FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE POLICY "Public display info is viewable by everyone"
ON public.profiles FOR SELECT
USING (true);
GRANT SELECT ON public.profiles TO anon;

REVOKE EXECUTE ON FUNCTION public.recalc_tool_rating() FROM PUBLIC, anon, authenticated;