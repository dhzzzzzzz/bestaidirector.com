import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_ai_tool",
  title: "Get AI tool details",
  description: "Fetch the full details of one AI tool by its id or exact name.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Tool id (uuid)."),
    name: z.string().trim().min(1).optional().describe("Exact tool name."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, name }) => {
    if (!id && !name) {
      return { content: [{ type: "text", text: "Provide either `id` or `name`." }], isError: true };
    }
    const supabase = supabaseAnon();
    let request = supabase.from("ai_tools").select("*, categories(name,slug)");
    request = id ? request.eq("id", id) : request.eq("name", name!);

    const { data, error } = await request.limit(1).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Tool not found." }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { tool: data },
    };
  },
});
