CREATE TABLE public.news_job_state (
  id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  locked_until timestamptz,
  last_success_at timestamptz,
  last_run_at timestamptz,
  last_error text,
  last_inserted integer DEFAULT 0
);
GRANT ALL ON public.news_job_state TO service_role;
GRANT SELECT ON public.news_job_state TO authenticated;
ALTER TABLE public.news_job_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view news job" ON public.news_job_state FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.news_job_state (id) VALUES ('fetch-ai-news');