import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "remove_favorite",
  title: "Remove a favorite",
  description: "Remove an AI tool from the signed-in user's favorites.",
  inputSchema: { tool_id: z.string().uuid().describe("Id of the AI tool to un-favorite.") },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  handler: async ({ tool_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { error } = await supabaseForUser(ctx)
      .from("favorites")
      .delete()
      .eq("user_id", ctx.getUserId())
      .eq("tool_id", tool_id);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: `Removed tool ${tool_id} from favorites.` }],
      structuredContent: { removed: true, tool_id },
    };
  },
});
