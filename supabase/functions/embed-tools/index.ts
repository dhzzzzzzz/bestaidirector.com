import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMBED_MODEL = "google/gemini-embedding-2";
const BATCH = 50; // gemini caps at 100 inputs / request

type Tool = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  detailed_description: string | null;
  tags: string[] | null;
  category_id: string | null;
};

/**
 * Weighted embedding text.
 * Important metadata (category, core use case, key features/tags) is repeated so it
 * dominates the vector; long prose is truncated so it cannot drown the signal.
 */
export function buildEmbeddingSource(tool: Tool, categoryName: string | null): string {
  const name = [tool.name, tool.name_en].filter(Boolean).join(" / ");
  const category = categoryName || "Other";
  const tags = (tool.tags || []).slice(0, 12).join(", ");
  const useCase = (tool.description_en || tool.description || "").trim().slice(0, 400);
  const features = (tool.detailed_description || "").trim().slice(0, 600);

  return [
    // weight 3: category
    `Category: ${category}`,
    `Category: ${category}`,
    `Category: ${category}`,
    // weight 2: core use case
    `Core use case: ${useCase}`,
    `Core use case: ${useCase}`,
    // weight 2: key features / tags
    `Key features: ${tags}`,
    `Key features: ${tags}`,
    // weight 1: identity + detail
    `Tool: ${name}`,
    features ? `Details: ${features}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function embed(inputs: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding failed (${res.status}): ${body.slice(0, 400)}`);
  }
  const json = await res.json();
  return (json.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: { limit?: number; reindex?: boolean } = {};
    try {
      body = await req.json();
    } catch (_) {
      // no body -> defaults
    }
    const limit = Math.min(Math.max(body.limit ?? 200, 1), 500);

    const { data: categories } = await supabase.from("categories").select("id, name");
    const categoryMap = new Map((categories || []).map((c) => [c.id, c.name as string]));

    let query = supabase
      .from("ai_tools")
      .select(
        "id, name, name_en, description, description_en, detailed_description, tags, category_id",
      )
      .limit(limit);
    if (!body.reindex) query = query.is("embedding", null);

    const { data: tools, error } = await query;
    if (error) throw error;
    if (!tools || tools.length === 0) {
      return new Response(JSON.stringify({ embedded: 0, remaining: 0, done: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let embedded = 0;
    for (let i = 0; i < tools.length; i += BATCH) {
      const slice = tools.slice(i, i + BATCH) as Tool[];
      const sources = slice.map((t) =>
        buildEmbeddingSource(t, t.category_id ? categoryMap.get(t.category_id) ?? null : null),
      );
      const vectors = await embed(sources, apiKey);
      for (let j = 0; j < slice.length; j++) {
        const { error: upErr } = await supabase
          .from("ai_tools")
          .update({
            embedding: JSON.stringify(vectors[j]),
            embedding_source: sources[j],
            embedded_at: new Date().toISOString(),
          })
          .eq("id", slice[j].id);
        if (upErr) console.error("update failed", slice[j].id, upErr.message);
        else embedded++;
      }
      console.log(`embedded ${embedded}/${tools.length}`);
    }

    const { count: remaining } = await supabase
      .from("ai_tools")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    return new Response(
      JSON.stringify({ embedded, remaining: remaining ?? 0, done: (remaining ?? 0) === 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("embed-tools error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
