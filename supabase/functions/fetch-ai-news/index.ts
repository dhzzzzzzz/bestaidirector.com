// Daily job: pulls latest AI news from RSS feeds, translates to zh/en/ja/ko, inserts into ai_news.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const JOB = "fetch-ai-news";
const MAX_ITEMS = 8;
const MIN_INTERVAL_H = 20;
const FEEDS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", source: "The Verge" },
  { url: "https://venturebeat.com/category/ai/feed/", source: "VentureBeat" },
];

type Item = { title: string; link: string; summary: string; date: string; source: string };

const strip = (s: string) =>
  s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"').replace(/&#\d+;|&\w+;/g, " ").replace(/\s+/g, " ").trim();
const tag = (block: string, name: string) => block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "";

async function readFeed(f: (typeof FEEDS)[number]): Promise<Item[]> {
  const res = await fetch(f.url, { headers: { "User-Agent": "Mozilla/5.0 BestAIDirector" } });
  if (!res.ok) return [];
  const xml = await res.text();
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/g) ?? [];
  return blocks.map((b) => {
    const link = strip(tag(b, "link")) || b.match(/<link[^>]*href="([^"]+)"/)?.[1] || "";
    return {
      title: strip(tag(b, "title")),
      link,
      summary: strip(tag(b, "description") || tag(b, "summary") || tag(b, "content")).slice(0, 600),
      date: strip(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated")),
      source: f.source,
    };
  }).filter((i) => i.title && i.link.startsWith("http"));
}

const schema = {
  type: "object", additionalProperties: false, required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["index", "is_hot", "title_zh", "summary_zh", "title_en", "summary_en", "title_ja", "summary_ja", "title_ko", "summary_ko"],
        properties: {
          index: { type: "integer" }, is_hot: { type: "boolean" },
          title_zh: { type: "string" }, summary_zh: { type: "string" },
          title_en: { type: "string" }, summary_en: { type: "string" },
          title_ja: { type: "string" }, summary_ja: { type: "string" },
          title_ko: { type: "string" }, summary_ko: { type: "string" },
        },
      },
    },
  },
};

async function translate(items: Item[], apiKey: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions:
        "You edit an AI news feed. For each item write a concise headline and a 1-2 sentence factual summary in Simplified Chinese, English, Japanese and Korean, based only on the given text. Keep product/company names in Latin form. Mark is_hot true only for major industry news (at most 2).",
      input: JSON.stringify(items.map((i, index) => ({ index, title: i.title, summary: i.summary }))),
      text: { format: { type: "json_schema", name: "news", strict: true, schema } },
    }),
  });
  if (!res.ok) {
    const err = new Error(`AI ${res.status}: ${(await res.text()).slice(0, 300)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  // Consume SSE, collect output text deltas
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta;
        if (ev.type === "response.failed" || ev.type === "error") throw new Error(JSON.stringify(ev).slice(0, 300));
      } catch (e) { if (e instanceof Error && !(e instanceof SyntaxError)) throw e; }
    }
  }
  if (!out) throw new Error("AI returned no content (possibly refused)");
  return JSON.parse(out).items as Array<Record<string, any>>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date();

  const { data: st } = await db.from("news_job_state").select("*").eq("id", JOB).single();
  if (st?.status === "paused") return json({ skipped: "paused", reason: st.last_error });
  if (st?.last_success_at && now.getTime() - new Date(st.last_success_at).getTime() < MIN_INTERVAL_H * 3600e3)
    return json({ skipped: "ran recently" });

  // single-flight lease
  const { data: lease } = await db.from("news_job_state")
    .update({ locked_until: new Date(now.getTime() + 10 * 60e3).toISOString(), last_run_at: now.toISOString() })
    .eq("id", JOB).or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`).select("id");
  if (!lease?.length) return json({ skipped: "locked" });

  try {
    const all = (await Promise.all(FEEDS.map((f) => readFeed(f).catch(() => [])))).flat();
    const cutoff = now.getTime() - 3 * 86400e3;
    const fresh = all.filter((i) => { const t = Date.parse(i.date); return !isNaN(t) && t > cutoff; })
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

    const { data: existing } = await db.from("ai_news").select("source_url").in("source_url", fresh.map((i) => i.link));
    const seen = new Set((existing ?? []).map((r) => r.source_url));
    const picked: Item[] = [];
    for (const i of fresh) { if (!seen.has(i.link)) { seen.add(i.link); picked.push(i); } if (picked.length >= MAX_ITEMS) break; }

    let inserted = 0;
    if (picked.length) {
      const tr = await translate(picked, Deno.env.get("LOVABLE_API_KEY")!);
      const rows = tr.filter((t) => picked[t.index]).map((t) => {
        const p = picked[t.index];
        return {
          title: t.title_zh, summary: t.summary_zh, title_en: t.title_en, summary_en: t.summary_en,
          title_ja: t.title_ja, summary_ja: t.summary_ja, title_ko: t.title_ko, summary_ko: t.summary_ko,
          source: p.source, source_en: p.source, source_ja: p.source, source_ko: p.source,
          source_url: p.link, published_at: new Date(Date.parse(p.date)).toISOString(), is_hot: !!t.is_hot,
        };
      });
      const { error } = await db.from("ai_news").insert(rows);
      if (error) throw error;
      inserted = rows.length;
    }
    await db.from("news_job_state").update({ locked_until: null, last_success_at: now.toISOString(), last_error: null, last_inserted: inserted }).eq("id", JOB);
    return json({ inserted, candidates: fresh.length });
  } catch (e) {
    const status = (e as any).status;
    const pause = status === 402 || status === 403;
    await db.from("news_job_state").update({ locked_until: null, last_error: String((e as Error).message), ...(pause ? { status: "paused" } : {}) }).eq("id", JOB);
    return json({ error: String((e as Error).message) }, status && status >= 400 ? status : 500);
  }
});
