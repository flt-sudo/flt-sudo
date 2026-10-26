import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { type AgentResult, type AgentTurn, LlmError, type LlmProvider, type ToolCallRecord, type ToolExecutor, type ToolSpec } from "./types.js";

/** OpenAI via the official SDK (Chat Completions with function tools + structured outputs). */
export class OpenAIProvider implements LlmProvider {
  readonly name = "openai" as const;
  readonly isModel = true;
  private client: OpenAI;

  constructor(apiKey: string, readonly model: string) {
    this.client = new OpenAI({ apiKey, maxRetries: 3 });
  }

  async generateJson<T>(args: { system: string; prompt: string; schema: z.ZodType<T>; name: string; maxTokens?: number }): Promise<T> {
    const res = await this.client.chat.completions.parse({
      model: this.model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.prompt },
      ],
      response_format: zodResponseFormat(args.schema as never, args.name),
      max_completion_tokens: args.maxTokens ?? 16000,
    });
    const msg = res.choices[0]?.message;
    if (msg?.refusal) throw new LlmError("refusal", msg.refusal);
    if (msg?.parsed == null) throw new LlmError("invalid_output", "The model did not return valid JSON for the schema.");
    return msg.parsed as T;
  }

  async runAgent(args: {
    system: string;
    history: AgentTurn[];
    userMessage: string;
    tools: ToolSpec[];
    execute: ToolExecutor;
    maxSteps?: number;
  }): Promise<AgentResult> {
    const tools: OpenAI.Chat.ChatCompletionTool[] = args.tools.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.inputSchema },
    }));
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: args.system },
      ...args.history.map((h) => ({ role: h.role, content: h.text }) as OpenAI.Chat.ChatCompletionMessageParam),
      { role: "user", content: args.userMessage },
    ];
    const calls: ToolCallRecord[] = [];
    for (let step = 0; step < (args.maxSteps ?? 8); step++) {
      const res = await this.client.chat.completions.create({ model: this.model, messages, tools, max_completion_tokens: 16000 });
      const choice = res.choices[0];
      const msg = choice?.message;
      if (!msg) throw new LlmError("api_error", "Empty response from OpenAI");
      if (msg.refusal) throw new LlmError("refusal", msg.refusal);
      messages.push(msg);
      const toolCalls = (msg.tool_calls ?? []).filter((c): c is OpenAI.Chat.ChatCompletionMessageFunctionToolCall => c.type === "function");
      if (!toolCalls.length) {
        return { text: (msg.content ?? "").trim(), toolCalls: calls, stopReason: choice?.finish_reason ?? "stop", model: res.model };
      }
      const results = await Promise.all(
        toolCalls.map(async (tc) => {
          let input: unknown;
          let output: unknown;
          let isError = false;
          try {
            input = JSON.parse(tc.function.arguments || "{}");
            const r = await args.execute(tc.function.name, input);
            output = r.output;
            isError = !!r.isError;
          } catch (err) {
            output = { error: (err as Error).message };
            isError = true;
          }
          calls.push({ name: tc.function.name, input, output, isError });
          return { role: "tool" as const, tool_call_id: tc.id, content: JSON.stringify(output) };
        }),
      );
      messages.push(...results);
    }
    return { text: "I stopped after too many steps. Try a more specific request.", toolCalls: calls, stopReason: "max_steps", model: this.model };
  }
}
