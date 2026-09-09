create extension if not exists vector;

alter table public.ai_tools
  add column if not exists embedding vector(3072),
  add column if not exists embedding_source text,
  add column if not exists embedded_at timestamptz;

create index if not exists ai_tools_embedding_idx
  on public.ai_tools using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

create index if not exists ai_tools_tags_idx on public.ai_tools using gin (tags);

create or replace function public.match_ai_tools(
  query_embedding vector(3072),
  match_count int default 60,
  filter_category_ids uuid[] default null,
  filter_tags text[] default null,
  min_rating numeric default null
)
returns table (
  id uuid,
  name text,
  description text,
  website_url text,
  logo_url text,
  tags text[],
  category_id uuid,
  rating_avg numeric,
  rating_count int,
  view_count int,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id, t.name, t.description, t.website_url, t.logo_url, t.tags,
    t.category_id, t.rating_avg, t.rating_count, t.view_count,
    1 - (t.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) as similarity
  from public.ai_tools t
  where t.embedding is not null
    and (filter_category_ids is null or t.category_id = any(filter_category_ids))
    and (filter_tags is null or t.tags && filter_tags)
    and (min_rating is null or coalesce(t.rating_avg, 0) >= min_rating)
  order by t.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
$$;

revoke all on function public.match_ai_tools(vector, int, uuid[], text[], numeric) from public, anon;
grant execute on function public.match_ai_tools(vector, int, uuid[], text[], numeric) to service_role;
