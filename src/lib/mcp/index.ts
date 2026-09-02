import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchTools from "./tools/search-tools";
import getTool from "./tools/get-tool";
import listCategories from "./tools/list-categories";
import listFavorites from "./tools/list-favorites";
import addFavorite from "./tools/add-favorite";
import removeFavorite from "./tools/remove-favorite";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ai",
  title: "AI 宝藏指南",
  version: "0.1.0",
  instructions:
    "Tools for the AI 宝藏指南 directory of 4000+ AI tools. Use `search_ai_tools` and `list_categories` to browse, `get_ai_tool` for full details, and the favorite tools to manage the signed-in user's saved tools.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchTools, getTool, listCategories, listFavorites, addFavorite, removeFavorite],
});
