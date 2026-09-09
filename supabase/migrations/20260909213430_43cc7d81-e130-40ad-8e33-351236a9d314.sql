revoke execute on function public.match_ai_tools(vector, int, uuid[], text[], numeric) from authenticated;
create schema if not exists extensions;
alter extension vector set schema extensions;
grant usage on schema extensions to postgres, anon, authenticated, service_role;
