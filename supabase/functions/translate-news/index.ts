import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const langNames: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const { batch_size = 15, lang = "en" } = await req.json();

    const { data: rows, error } = await supabase
      .from("ai_news")
      .select("id, title, summary")
      .is(`title_${lang}`, null)
      .limit(batch_size);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: `No more news to translate for ${lang}`, translated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Translate Chinese AI news items into ${langNames[lang]}. Keep brand and product names in their original Latin form. Return ONLY a JSON array of {"id","title","summary"}. No markdown.`,
          },
          { role: "user", content: JSON.stringify(rows) },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: Array<{ id: string; title: string; summary: string }> = JSON.parse(content);

    let translated = 0;
    for (const item of parsed) {
      if (!item?.id || !item?.title) continue;
      const { error: upErr } = await supabase
        .from("ai_news")
        .update({ [`title_${lang}`]: item.title, [`summary_${lang}`]: item.summary ?? null })
        .eq("id", item.id);
      if (!upErr) translated++;
    }

    const { count } = await supabase
      .from("ai_news")
      .select("id", { count: "exact", head: true })
      .is(`title_${lang}`, null);

    return new Response(JSON.stringify({ success: true, translated, remaining: count, lang }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
