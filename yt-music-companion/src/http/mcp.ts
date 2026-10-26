import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { callTool, type ToolContext, ToolError, TOOLS } from "../tools/registry.js";

/**
 * Remote MCP endpoint (Streamable HTTP, stateless). Each request gets a fresh
 * server bound to the caller's OAuth scopes, so a read-only grant never even
 * lists write tools.
 */
export function buildMcpServer(ctx: ToolContext, scopes: string[]): McpServer {
  const server = new McpServer(
    { name: "yt-music-companion", version: "0.1.0" },
    {
      instructions:
        "Personal YouTube Music companion. Use get_music_profile/get_recent_listening for taste questions (observed vs AI-inferred data is labelled; mention freshness). " +
        "Recommend only tracks returned by tools. generate_playlist makes a local draft; create_playlist saves it to YouTube Music. " +
        "add_tracks_to_playlist may return confirmation_required: ask the user, then confirm_action. Playback can't be controlled remotely: " +
        "give open_music links and never claim something is playing.",
    },
  );
  for (const tool of TOOLS) {
    if (!scopes.includes(tool.scope)) continue;
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input,
        annotations: {
          title: tool.title,
          readOnlyHint: tool.readOnly,
          destructiveHint: tool.remoteWrite,
          idempotentHint: tool.readOnly,
          openWorldHint: tool.remoteWrite,
        },
      },
      async (input: unknown) => {
        try {
          const result = await callTool(ctx, tool.name, input, scopes);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result) }],
            structuredContent: (result && typeof result === "object" && !Array.isArray(result) ? result : { result }) as Record<string, unknown>,
          };
        } catch (err) {
          const e = err instanceof ToolError ? { error: err.code, message: err.message } : { error: "internal_error", message: "Unexpected error" };
          ctx.log?.warn({ tool: tool.name, err: (err as Error).message }, "mcp tool error");
          return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(e) }] };
        }
      },
    );
  }
  return server;
}

export async function handleMcp(ctx: ToolContext, req: Request, res: Response): Promise<void> {
  const scopes = req.auth?.scopes ?? [];
  const server = buildMcpServer(ctx, scopes);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
