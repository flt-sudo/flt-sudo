# Using it from ChatGPT

## What's feasible

ChatGPT can call this backend **only** as a remote MCP server ("app" / "custom connector") added in **developer mode**. Pasting a URL into a normal chat does nothing.

OpenAI's help center ([Developer mode and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt-beta)) currently describes:

- Full MCP support, including write actions, as a **beta for ChatGPT Business, Enterprise and Edu**, on **ChatGPT web**.
- Admins enabling developer mode in workspace settings.

Coverage from late 2025 also said Plus and Pro had developer mode, and 2026 third-party guides disagree on Plus/Pro, including read-only limits. **Open ChatGPT → Settings → Apps & Connectors → Advanced → Developer mode to see what your plan offers.** Apps published to OpenAI's directory skip developer mode. That needs app submission and review, which is out of scope for a personal tool.

If your plan doesn't allow it, the **standalone PWA chat** (`/`) has the same tools and works with your OpenAI or Anthropic API key.

## Requirements

1. A **public HTTPS URL**: Cloudflare Tunnel, a VPS, etc. (see `iphone-setup.md`). Tailscale-only hosts aren't reachable by ChatGPT.
2. `PUBLIC_BASE_URL` set to that origin. It becomes the OAuth issuer.
3. The server running with your YouTube Music account connected and your data imported.

## Connect

1. In ChatGPT (web): **Settings → Apps & Connectors → Advanced settings → enable Developer mode**.
2. **Create** a connector:
   - MCP server URL: `https://YOUR_HOST/mcp`
   - Authentication: **OAuth**
3. ChatGPT registers itself (dynamic client registration) and opens the app's **consent page**. Enter your passphrase and tap **Allow**.
4. In a chat, enable the connector from the tools menu and ask, for example:
   - "Analyze my music taste."
   - "Build me a 90-minute late-night driving playlist and save it."
   - "Add *Heartline* to my Late Night playlist." The tool returns `confirmation_required`; ChatGPT asks you and then calls `confirm_action`.

## Security notes

- Every tool call is authenticated with a short-lived OAuth token (1 hour). Refresh tokens rotate.
- Write tools are annotated `readOnlyHint: false` / `destructiveHint: true`, so ChatGPT asks before calling them. Modifying existing playlists also requires the app-level confirmation.
- To revoke: **Settings → Connected AI apps → Revoke** in the PWA. This kills the client and all its tokens.
- Granting only `music:read` hides the write tools entirely.

## Not tested from the build environment

The OAuth and MCP flow is covered by automated tests (registration → consent → PKCE token → `initialize` → `tools/list` → `tools/call` → refresh rotation → revocation). Connecting the actual ChatGPT product needs your deployment and an eligible plan.
