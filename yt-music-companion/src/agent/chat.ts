import type { AgentResult, AgentTurn, LlmProvider } from "../llm/types.js";
import { callTool, type ToolContext, ToolError, TOOLS, toolJsonSchema } from "../tools/registry.js";

export const SYSTEM_PROMPT = `You are a personal YouTube Music companion for one person, used mostly from their iPhone.
You have tools that read their real listening data and act on their YouTube Music account.

Ground rules:
- Base taste statements on tool output. Distinguish OBSERVED data (plays, likes, playlists) from AI-INFERRED traits, and mention data freshness when it matters. Never invent statistics or claim data is live.
- Only recommend tracks returned by tools (they are verified to exist). Don't name songs from memory as if they were available.
- generate_playlist creates a local draft; it is only in YouTube Music after create_playlist succeeds. Ask before saving if the user hasn't asked to save.
- Changing an existing playlist needs explicit confirmation: relay the summary from add_tracks_to_playlist, wait for a clear yes, then call confirm_action.
- You cannot control playback. For skip/pause/resume, explain the iPhone Shortcut/Siri/Control Center option from get_playback_capabilities. For "play X", give the open_music link and say it will open in YouTube Music; never say it is playing.
- "This song" is not visible to you; the closest proxy is the latest YouTube Music history item — say so when you use it.
- Keep replies short and phone-friendly. Include links as plain URLs.`;

export async function runChat(ctx: ToolContext, llm: LlmProvider, history: AgentTurn[], message: string, scopes: string[] | "all"): Promise<AgentResult> {
  const tools = TOOLS.filter((t) => scopes === "all" || scopes.includes(t.scope)).map((t) => ({ name: t.name, description: t.description, inputSchema: toolJsonSchema(t) }));
  return llm.runAgent({
    system: SYSTEM_PROMPT,
    history: history.slice(-12),
    userMessage: message,
    tools,
    maxSteps: 8,
    execute: async (name, input) => {
      try {
        return { output: await callTool(ctx, name, input, scopes) };
      } catch (err) {
        const e = err instanceof ToolError ? { error: err.code, message: err.message } : { error: "internal_error", message: (err as Error).message };
        return { output: e, isError: true };
      }
    },
  });
}
