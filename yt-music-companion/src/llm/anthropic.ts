import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { type AgentResult, type AgentTurn, LlmError, type LlmProvider, type ToolCallRecord, type ToolExecutor, type ToolSpec } from "./types.js";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/**
 * Claude via the official Anthropic SDK. Thinking is adaptive by default on
 * current models, so it is not configured; depth is controlled with effort.
 * Server-side refusal fallbacks are enabled by default (beta) and can be
 * turned off with ANTHROPIC_FALLBACKS=off.
 */
export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic" as const;
  readonly isModel = true;
  private client: Anthropic;

  constructor(
    apiKey: string,
    readonly model: string,
    private effort: Effort,
    private fallbacks: boolean,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 3 });
  }

  private fallbackParams() {
    return this.fallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {};
  }

  async generateJson<T>(args: { system: string; prompt: string; schema: z.ZodType<T>; name: string; maxTokens?: number }): Promise<T> {
    const res = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: args.maxTokens ?? 16000,
      system: args.system,
      messages: [{ role: "user", content: args.prompt }],
      output_config: { effort: this.effort, format: betaZodOutputFormat(args.schema) },
      ...this.fallbackParams(),
    });
    if (res.stop_reason === "refusal") throw new LlmError("refusal", "The model declined this request.");
    if (res.stop_reason === "max_tokens") throw new LlmError("invalid_output", "The model ran out of output tokens.");
    if (res.parsed_output == null) throw new LlmError("invalid_output", "The model did not return valid JSON for the schema.");
    return res.parsed_output as T;
  }

  async runAgent(args: {
    system: string;
    history: AgentTurn[];
    userMessage: string;
    tools: ToolSpec[];
    execute: ToolExecutor;
    maxSteps?: number;
  }): Promise<AgentResult> {
    const tools: Anthropic.Beta.BetaTool[] = args.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Beta.BetaTool["input_schema"],
    }));
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...args.history.map((h) => ({ role: h.role, content: h.text })),
      { role: "user", content: args.userMessage },
    ];
    const calls: ToolCallRecord[] = [];
    const maxSteps = args.maxSteps ?? 8;

    for (let step = 0; step < maxSteps; step++) {
      const res = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 16000,
        system: args.system,
        tools,
        messages,
        output_config: { effort: this.effort },
        ...this.fallbackParams(),
      });
      if (res.stop_reason === "refusal") throw new LlmError("refusal", "The model declined this request.");

      // Append the full content (including any thinking blocks) unchanged.
      messages.push({ role: "assistant", content: res.content });
      const toolUses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (res.stop_reason !== "tool_use" || toolUses.length === 0) {
        if (res.stop_reason === "pause_turn") continue;
        const text = res.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return { text, toolCalls: calls, stopReason: res.stop_reason ?? "end_turn", model: res.model };
      }

      // Run parallel tool calls concurrently; return all results in one user message.
      const results = await Promise.all(
        toolUses.map(async (tu) => {
          let output: unknown;
          let isError = false;
          try {
            const r = await args.execute(tu.name, tu.input);
            output = r.output;
            isError = !!r.isError;
          } catch (err) {
            output = { error: (err as Error).message };
            isError = true;
          }
          calls.push({ name: tu.name, input: tu.input, output, isError });
          const block: Anthropic.Beta.BetaToolResultBlockParam = {
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(output),
            is_error: isError,
          };
          return block;
        }),
      );
      messages.push({ role: "user", content: results });
    }
    return { text: "I stopped after too many steps. Try a more specific request.", toolCalls: calls, stopReason: "max_steps", model: this.model };
  }
}
