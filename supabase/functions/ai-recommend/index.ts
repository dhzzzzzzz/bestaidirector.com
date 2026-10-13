import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { dynamicTopK, rrfFuse, safeKeyword, sanitizePlan, type Candidate } from "./ranking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHAT_MODEL = "google/gemini-3-flash-preview";
const EMBED_MODEL = "google/gemini-embedding-2";
const CANDIDATES = 80;
const KEYWORD_CANDIDATES = 40;
const MAX_FINAL = 8;
const LOW_SIM = 0.55; // below this, the agent rewrites the query and retrieves once more
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

class GatewayError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// Bounded retry: only 429/5xx are retryable, max 2 attempts with backoff.
async function gatewayFetch(path: string, apiKey: string, body: unknown): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${GATEWAY}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    const t = (await res.text()).slice(0, 300);
    console.error("gateway", path, res.status, t);
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === 1) {
      if (res.status === 429) throw new GatewayError("请求过于频繁，请稍后再试", 429);
      if (res.status === 402) throw new GatewayError("AI额度不足，请联系管理员充值", 402);
      if (res.status === 403) throw new GatewayError("AI服务暂不可用（权限受限）", 403);
      throw new GatewayError("AI服务暂时不可用", res.status >= 500 ? 503 : 500);
    }
    const ra = Number(res.headers.get("retry-after"));
    await new Promise((r) => setTimeout(r, (ra > 0 ? ra * 1000 : 800) + Math.random() * 400));
  }
  throw new GatewayError("AI服务暂时不可用", 503);
}

// Structured output via strict JSON schema; regex parse kept only as a fallback.
async function chatJSON<T>(apiKey: string, system: string, user: string, maxTokens: number, schemaName: string, schema: unknown): Promise<T> {
  const res = await gatewayFetch("/chat/completions", apiKey, {
    model: CHAT_MODEL,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
  });
  const json = await res.json();
  const content: string = json.choices?.[0]?.message?.content ?? "";
  try { return JSON.parse(content); } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI返回格式错误");
    return JSON.parse(m[0]);
  }
}

async function embedQuery(apiKey: string, text: string): Promise<number[]> {
  const res = await gatewayFetch("/embeddings", apiKey, { model: EMBED_MODEL, input: text });
  const json = await res.json();
  return json.data[0].embedding as number[];
}

const PLAN_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["categories", "tags", "min_rating", "search_text"],
  properties: {
    categories: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
    min_rating: { type: ["number", "null"] },
    search_text: { type: "string" },
  },
};
const RERANK_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["recommendations", "summary", "sufficient"],
  properties: {
    recommendations: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["index", "reason"],
        properties: { index: { type: "integer" }, reason: { type: "string" } } },
    },
    summary: { type: "string" },
    sufficient: { type: "boolean" },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const trace: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const query = body?.query;
    if (!query || typeof query !== "string" || !query.trim()) return reply({ error: "请输入您的需求描述" }, 400);
    const userQuery = query.trim().slice(0, 500);
    // Short-term session memory: previous queries in this search session (client-held, max 3).
    const history: string[] = Array.isArray(body?.history)
      ? body.history.filter((h: unknown) => typeof h === "string").slice(-3).map((h: string) => h.slice(0, 200))
      : [];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("AI服务未配置");

    // Read-only access: the agent can only call fixed, server-defined read tools (no write tools exposed to the LLM).
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: categories } = await supabase.from("categories").select("id, name, slug");
    const cats = categories || [];
    const catNames = cats.map((c) => c.name as string);
    const categoryMap = new Map(cats.map((c) => [c.id, c.name as string]));

    // ---------- Step 1 (LLM): query understanding ----------
    const planPrompt = `你是AI工具检索的查询解析器。根据用户需求输出结构化检索条件。
- categories：最多3个，必须逐字来自给定分类列表；不确定则为空数组
- tags：最多6个关键能力/技术关键词，中英文均可
- min_rating：仅当用户明确要求高评分时填 0-5，否则 null
- search_text：把需求改写为检索文本，突出使用场景、核心功能、关键特性
若提供了"之前的搜索"，当前需求可能是对它的补充（如"要免费的""换个便宜的"），请合并理解。`;
    const planUser = `分类列表：${catNames.join("、")}\n${history.length ? `之前的搜索：${history.join(" → ")}\n` : ""}\n用户需求：${userQuery}`;

    let plan = sanitizePlan({}, catNames);
    try {
      plan = sanitizePlan(await chatJSON(apiKey, planPrompt, planUser, 500, "query_plan", PLAN_SCHEMA), catNames);
      trace.push("plan:ok");
    } catch (e) {
      if (e instanceof GatewayError && (e.status === 402 || e.status === 403)) throw e;
      console.error("plan failed, fallback to raw query", e);
      trace.push("plan:fallback");
    }

    const filterCategoryIds = plan.categories.map((n) => cats.find((c) => c.name === n)?.id).filter(Boolean) as string[];

    // ---------- Step 2 (deterministic): hybrid retrieval ----------
    const runVector = async (text: string, o: { cats: string[] | null; tags: string[] | null; minRating: number | null }) => {
      const emb = await embedQuery(apiKey, text);
      const { data, error } = await supabase.rpc("match_ai_tools", {
        query_embedding: JSON.stringify(emb), match_count: CANDIDATES,
        filter_category_ids: o.cats, filter_tags: o.tags, min_rating: o.minRating,
      });
      if (error) throw new Error(error.message);
      return (data || []) as Candidate[];
    };
    const runKeyword = async (words: string[]) => {
      const ks = [...new Set(words.map(safeKeyword).filter((k) => k.length >= 2))].slice(0, 6);
      if (!ks.length) return [] as Candidate[];
      const or = ks.flatMap((k) => [`name.ilike.*${k}*`, `description.ilike.*${k}*`]).join(",");
      const { data, error } = await supabase.from("ai_tools")
        .select("id, name, description, website_url, logo_url, tags, category_id, rating_avg, rating_count, view_count")
        .or(or).order("view_count", { ascending: false }).limit(KEYWORD_CANDIDATES);
      if (error) { console.error("keyword search", error.message); return []; }
      return (data || []) as Candidate[];
    };

    const retrieve = async (text: string, keywords: string[]) => {
      const textWithMeta = [text,
        plan.categories.length ? `Category: ${plan.categories.join(", ")}` : "",
        plan.tags.length ? `Key features: ${plan.tags.join(", ")}` : ""].filter(Boolean).join("\n");
      let mode = "category+tags";
      let vec = await runVector(textWithMeta, {
        cats: filterCategoryIds.length ? filterCategoryIds : null,
        tags: plan.tags.length ? plan.tags : null, minRating: plan.min_rating,
      });
      if (vec.length < 20 && (filterCategoryIds.length || plan.tags.length)) {
        vec = await runVector(textWithMeta, { cats: filterCategoryIds.length ? filterCategoryIds : null, tags: null, minRating: plan.min_rating });
        mode = "category";
      }
      if (vec.length < 10) { vec = await runVector(textWithMeta, { cats: null, tags: null, minRating: null }); mode = "none"; }
      const kw = await runKeyword(keywords);
      return { vec, kw, mode };
    };

    let { vec, kw, mode } = await retrieve(plan.search_text || userQuery, [userQuery, ...plan.tags]);
    trace.push(`retrieve:${mode} vec=${vec.length} kw=${kw.length} top=${vec[0]?.similarity?.toFixed?.(3)}`);

    // ---------- Step 3 (agentic): one bounded re-retrieval when recall looks weak ----------
    let rewritten: string | null = null;
    if ((vec[0]?.similarity ?? 0) < LOW_SIM && kw.length < 5) {
      try {
        const r = await chatJSON<{ query: string; keywords: string[] }>(apiKey,
          "用户的搜索召回效果差。把需求改写成更通用、更常见的AI工具描述，并给出3-6个同义关键词（中英文）。",
          `原需求：${userQuery}`, 300, "rewrite",
          { type: "object", additionalProperties: false, required: ["query", "keywords"],
            properties: { query: { type: "string" }, keywords: { type: "array", items: { type: "string" } } } });
        rewritten = String(r.query || "").slice(0, 500);
        const second = await retrieve(rewritten || userQuery, (r.keywords || []).filter((x) => typeof x === "string"));
        vec = rrfFuse(vec, second.vec); kw = rrfFuse(kw, second.kw);
        trace.push(`rewrite:ok vec=${vec.length} kw=${kw.length}`);
      } catch (e) {
        if (e instanceof GatewayError && (e.status === 402 || e.status === 403)) throw e;
        trace.push("rewrite:skipped");
      }
    }

    const candidates = rrfFuse(vec, kw).slice(0, CANDIDATES);
    if (candidates.length === 0) {
      return reply({ recommendations: [], summary: "暂未找到匹配的工具，换个说法再试试", query: userQuery, debug: { trace } });
    }

    // ---------- Step 4 (LLM): rerank + self-check ----------
    const list = candidates.map((t, i) => {
      const cat = t.category_id ? categoryMap.get(t.category_id as string) || "其他" : "其他";
      const tags = Array.isArray(t.tags) && t.tags.length ? (t.tags as string[]).join(", ") : "无";
      const rating = Number(t.rating_avg) > 0 ? `评分${t.rating_avg}(${t.rating_count})` : "暂无评分";
      return `${i + 1}. ${t.name} [分类: ${cat}] [特性: ${tags}] [${rating}] - ${String(t.description || "无描述").slice(0, 160)}`;
    }).join("\n");

    let reranked: { recommendations: { index: number; reason: string }[]; summary: string; sufficient: boolean } | null = null;
    try {
      reranked = await chatJSON(apiKey,
        `你是AI工具推荐专家。从候选列表中选出与用户需求真正相关的工具，最多${MAX_FINAL}个、按相关性排序；不相关的不要凑数。
排序权重：分类匹配 > 核心用途匹配 > 关键特性匹配 > 口碑评分。index 必须是候选列表中的序号。
reason 30字内；summary 50字内；sufficient 表示候选是否足以满足需求。`,
        `用户需求：${userQuery}${history.length ? `\n之前的搜索：${history.join(" → ")}` : ""}\n\n候选工具：\n${list}`,
        1200, "rerank", RERANK_SCHEMA);
      trace.push(`rerank:ok sufficient=${reranked.sufficient}`);
    } catch (e) {
      if (e instanceof GatewayError && (e.status === 402 || e.status === 403)) throw e;
      trace.push("rerank:fallback");
    }

    // Validate LLM output: drop out-of-range / duplicate indexes.
    const seen = new Set<string>();
    let picks = (reranked?.recommendations || [])
      .filter((r) => Number.isInteger(r.index) && r.index >= 1 && r.index <= candidates.length)
      .map((r) => ({ tool: candidates[r.index - 1], reason: String(r.reason || "").slice(0, 60) }))
      .filter((p) => !seen.has(p.tool.id) && seen.add(p.tool.id))
      .slice(0, MAX_FINAL);

    if (picks.length === 0) {
      const sims = vec.map((v) => Number(v.similarity) || 0);
      const k = dynamicTopK(sims, 3, MAX_FINAL);
      picks = candidates.slice(0, k).map((t) => ({ tool: t, reason: "与您的需求语义高度相关" }));
    }

    const recommendations = picks.map(({ tool, reason }) => ({
      id: tool.id, name: tool.name, description: tool.description, website_url: tool.website_url,
      logo_url: tool.logo_url, tags: tool.tags, category_id: tool.category_id,
      category_name: tool.category_id ? categoryMap.get(tool.category_id as string) ?? null : null,
      rating_avg: tool.rating_avg, rating_count: tool.rating_count, similarity: tool.similarity ?? null,
      recommendation_reason: reason,
    }));

    console.log(`query="${userQuery}" ${trace.join(" | ")}`);
    return reply({
      recommendations,
      summary: reranked?.summary || "根据您的需求，为您推荐以上AI工具",
      query: userQuery,
      rewritten_query: rewritten,
      debug: { trace, candidates: candidates.length },
    });
  } catch (error) {
    console.error("AI Recommend error:", error, trace);
    const status = error instanceof GatewayError ? error.status : 500;
    return reply({ error: error instanceof Error ? error.message : "推荐服务出错，请稍后重试", recommendations: [] }, status);
  }
});
