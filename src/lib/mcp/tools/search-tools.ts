import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

const SELECT =
  "id,name,description,description_en,website_url,logo_url,tags,is_hot,is_featured,view_count,rating_avg,rating_count,category_id";

export default defineTool({
  name: "search_ai_tools",
  title: "Search AI tools",
  description:
    "Search the AI tool directory by keyword (name, description or tag), optionally filtered by category slug.",
  inputSchema: {
    query: z.string().trim().min(1).optional().describe("Keyword to search for."),
    category_slug: z.string().trim().optional().describe("Category slug, e.g. ai-chat."),
    limit: z.number().int().min(1).max(50).default(10).describe("Max number of results."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category_slug, limit }) => {
    const supabase = supabaseAnon();

    let categoryId: string | undefined;
    if (category_slug) {
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .maybeSingle();
      if (catError) return { content: [{ type: "text", text: catError.message }], isError: true };
      if (!cat) {
        return {
          content: [{ type: "text", text: `No category found with slug "${category_slug}".` }],
          isError: true,
        };
      }
      categoryId = cat.id as string;
    }

    let request = supabase.from("ai_tools").select(SELECT);
    if (categoryId) request = request.eq("category_id", categoryId);
    if (query) {
      const safe = query.replace(/[%_,]/g, " ").trim();
      request = request.or(
        `name.ilike.%${safe}%,description.ilike.%${safe}%,description_en.ilike.%${safe}%`,
      );
    }

    const { data, error } = await request
      .order("view_count", { ascending: false })
      .limit(limit ?? 10);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tools: data ?? [], count: data?.length ?? 0 },
    };
  },
});
