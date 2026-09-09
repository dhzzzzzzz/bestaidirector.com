import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHAT_MODEL = "google/gemini-3-flash-preview";
const EMBED_MODEL = "google/gemini-embedding-2";
const CANDIDATES = 80; // wide retrieval, narrowed by the reranker
const FINAL = 8;

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

async function chatJSON(apiKey: string, system: string, user: string, maxTokens: number) {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway error", res.status, t.slice(0, 400));
    if (res.status === 429) throw new Error("请求过于频繁，请稍后再试");
    if (res.status === 402) throw new Error("AI额度不足，请联系管理员充值");
    throw new Error("AI服务暂时不可用");
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI返回格式错误");
  return JSON.parse(match[0]);
}

async function embedQuery(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) {
    console.error("Embedding error", res.status, (await res.text()).slice(0, 300));
    throw new Error("语义检索服务暂时不可用");
  }
  const json = await res.json();
  return json.data[0].embedding as number[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(JSON.stringify({ error: "请输入您的需求描述" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userQuery = query.trim().slice(0, 500);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("AI服务未配置");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: categories } = await supabase.from("categories").select("id, name, slug");
    const cats = categories || [];
    const categoryMap = new Map(cats.map((c) => [c.id, c.name as string]));

    // ---------- Stage 1: query understanding -> metadata filters + enriched search text ----------
    let plan: {
      categories?: string[];
      tags?: string[];
      min_rating?: number | null;
      search_text?: string;
    } = {};
    try {
      plan = await chatJSON(
        apiKey,
        `你是AI工具检索的查询解析器。根据用户需求，输出用于检索的结构化过滤条件。
只返回JSON：
{
  "categories": ["最多3个最相关的分类名称，必须来自给定分类列表；不确定则为空数组"],
  "tags": ["最多6个关键能力/技术标签关键词，中英文均可"],
  "min_rating": null 或 0-5 的数字（用户明确要求高评分时才填）,
  "search_text": "把用户需求改写成一段检索文本，突出：使用场景、核心功能、关键特性、目标分类"
}`,
        `分类列表：${cats.map((c) => c.name).join("、")}\n\n用户需求：${userQuery}`,
        500,
      );
    } catch (e) {
      console.error("query planning failed, falling back", e);
    }

    const filterCategoryIds = (plan.categories || [])
      .map((n) => cats.find((c) => c.name === n || c.slug === n)?.id)
      .filter(Boolean) as string[];
    const filterTags = (plan.tags || []).filter((t) => typeof t === "string" && t.trim()).slice(0, 6);

    // Weighted query text mirrors how tools are embedded (category + use case + features).
    const searchText = [
      plan.search_text || userQuery,
      filterCategoryIds.length ? `Category: ${plan.categories?.join(", ")}` : "",
      filterTags.length ? `Key features: ${filterTags.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const queryEmbedding = await embedQuery(apiKey, searchText);

    // ---------- Stage 2: metadata pre-filter + wide vector retrieval ----------
    const runMatch = async (opts: {
      cats: string[] | null;
      tags: string[] | null;
      minRating: number | null;
    }) => {
      const { data, error } = await supabase.rpc("match_ai_tools", {
        query_embedding: JSON.stringify(queryEmbedding),
        match_count: CANDIDATES,
        filter_category_ids: opts.cats,
        filter_tags: opts.tags,
        min_rating: opts.minRating,
      });
      if (error) throw new Error(error.message);
      return data || [];
    };

    const minRating =
      typeof plan.min_rating === "number" && plan.min_rating > 0 ? plan.min_rating : null;

    let candidates = await runMatch({
      cats: filterCategoryIds.length ? filterCategoryIds : null,
      tags: filterTags.length ? filterTags : null,
      minRating,
    });
    let filterMode = "category+tags";

    // Relax filters progressively when the pre-filter is too narrow.
    if (candidates.length < 20 && (filterCategoryIds.length || filterTags.length)) {
      candidates = await runMatch({
        cats: filterCategoryIds.length ? filterCategoryIds : null,
        tags: null,
        minRating,
      });
      filterMode = "category";
    }
    if (candidates.length < 10) {
      candidates = await runMatch({ cats: null, tags: null, minRating: null });
      filterMode = "none";
    }

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({
          recommendations: [],
          summary: "暂未找到匹配的工具，换个说法再试试",
          query: userQuery,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(
      `query="${userQuery}" filter=${filterMode} candidates=${candidates.length} top_sim=${candidates[0]?.similarity?.toFixed?.(3)}`,
    );

    // ---------- Stage 3: LLM rerank of the candidate set ----------
    const list = candidates
      .map((t: Record<string, unknown>, i: number) => {
        const cat = t.category_id ? categoryMap.get(t.category_id as string) || "其他" : "其他";
        const tags = Array.isArray(t.tags) && t.tags.length ? (t.tags as string[]).join(", ") : "无";
        const rating = Number(t.rating_avg) > 0 ? `评分${t.rating_avg}(${t.rating_count})` : "暂无评分";
        return `${i + 1}. ${t.name} [分类: ${cat}] [特性: ${tags}] [${rating}] - ${
          (t.description as string) || "无描述"
        }`;
      })
      .join("\n");

    let reranked: { recommendations?: { index: number; reason: string }[]; summary?: string } = {};
    try {
      reranked = await chatJSON(
        apiKey,
        `你是AI工具推荐专家。对候选列表按与用户需求的相关性重排，选出最匹配的${FINAL}个。
排序权重：分类匹配 > 核心用途匹配 > 关键特性匹配 > 口碑评分。
只返回JSON：
{"recommendations":[{"index":序号,"reason":"30字内推荐理由"}],"summary":"50字内总结"}`,
        `用户需求：${userQuery}\n\n候选工具：\n${list}`,
        1200,
      );
    } catch (e) {
      console.error("rerank failed, using vector order", e);
    }

    let picks = (reranked.recommendations || [])
      .map((r) => ({ tool: candidates[r.index - 1], reason: r.reason }))
      .filter((p) => p.tool);

    if (picks.length === 0) {
      picks = candidates.slice(0, FINAL).map((t: Record<string, unknown>) => ({
        tool: t,
        reason: "与您的需求语义高度相关",
      }));
    }

    const recommendations = picks.slice(0, FINAL).map(({ tool, reason }) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      website_url: tool.website_url,
      logo_url: tool.logo_url,
      tags: tool.tags,
      category_id: tool.category_id,
      category_name: tool.category_id ? categoryMap.get(tool.category_id) ?? null : null,
      rating_avg: tool.rating_avg,
      rating_count: tool.rating_count,
      similarity: tool.similarity,
      recommendation_reason: reason,
    }));

    return new Response(
      JSON.stringify({
        recommendations,
        summary: reranked.summary || "根据您的需求，为您推荐以上AI工具",
        query: userQuery,
        debug: { filterMode, candidates: candidates.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("AI Recommend error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "推荐服务出错，请稍后重试",
        recommendations: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
