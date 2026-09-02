import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_favorite",
  title: "Favorite an AI tool",
  description: "Add an AI tool to the signed-in user's favorites.",
  inputSchema: { tool_id: z.string().uuid().describe("Id of the AI tool to favorite.") },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ tool_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("favorites")
      .insert({ user_id: ctx.getUserId(), tool_id })
      .select("id,tool_id,created_at");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? {}, null, 2) }],
      structuredContent: { favorite: data?.[0] ?? null },
    };
  },
});
