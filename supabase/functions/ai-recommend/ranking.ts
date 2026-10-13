// Pure ranking helpers for the recommendation pipeline (kept side-effect free so they can be unit tested).

export type Candidate = { id: string; similarity?: number; [k: string]: unknown };

/** Reciprocal Rank Fusion of vector and keyword result lists. */
export function rrfFuse(vector: Candidate[], keyword: Candidate[], k = 60): Candidate[] {
  const score = new Map<string, number>();
  const byId = new Map<string, Candidate>();
  const add = (list: Candidate[], weight: number) =>
    list.forEach((c, i) => {
      score.set(c.id, (score.get(c.id) || 0) + weight / (k + i + 1));
      if (!byId.has(c.id)) byId.set(c.id, c);
    });
  add(vector, 1);
  add(keyword, 1);
  return [...byId.values()].sort((a, b) => (score.get(b.id)! - score.get(a.id)!));
}

/**
 * Dynamic Top-K: return fewer results when relevance drops sharply.
 * Keeps at least `min`, at most `max`; cuts once similarity falls below
 * `ratio` of the best score.
 */
export function dynamicTopK(sims: number[], min = 3, max = 8, ratio = 0.8): number {
  if (sims.length <= min) return sims.length;
  const best = sims[0] || 0;
  if (best <= 0) return Math.min(max, sims.length);
  let k = min;
  while (k < Math.min(max, sims.length) && sims[k] >= best * ratio) k++;
  return k;
}

/** Validate/clamp the LLM query plan so bad parameters never reach the database. */
export function sanitizePlan(raw: unknown, categoryNames: string[]) {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) as string[] : []);
  const cats = arr(p.categories).filter((c) => categoryNames.includes(c)).slice(0, 3);
  const tags = arr(p.tags).map((t) => t.trim().slice(0, 40)).slice(0, 6);
  const r = typeof p.min_rating === "number" && isFinite(p.min_rating) ? p.min_rating : null;
  const minRating = r !== null && r > 0 ? Math.min(5, r) : null;
  const searchText = typeof p.search_text === "string" ? p.search_text.slice(0, 800) : "";
  return { categories: cats, tags, min_rating: minRating, search_text: searchText };
}

/** Strip characters that would break a PostgREST `or=` ilike filter. */
export function safeKeyword(k: string): string {
  return k.replace(/[,()%*\\]/g, " ").trim().slice(0, 40);
}
