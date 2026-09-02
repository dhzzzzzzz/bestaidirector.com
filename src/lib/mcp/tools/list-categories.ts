import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List all AI tool categories with their slug, icon and tool count ordering.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const { data, error } = await supabaseAnon()
      .from("categories")
      .select("id,name,slug,description,icon,display_order")
      .order("display_order", { ascending: true });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { categories: data ?? [] },
    };
  },
});
