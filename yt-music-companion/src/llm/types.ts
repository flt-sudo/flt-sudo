import type { z } from "zod";

export interface ToolSpec {
  name: string;
  description: string;
  /** JSON Schema (object) for the tool input. */
  inputSchema: Record<string, unknown>;
}

export interface AgentTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ToolCallRecord {
  name: string;
  input: unknown;
  output: unknown;
  isError: boolean;
}

export interface AgentResult {
  text: string;
  toolCalls: ToolCallRecord[];
  stopReason: string;
  model: string;
}

export type ToolExecutor = (name: string, input: unknown) => Promise<{ output: unknown; isError?: boolean }>;

export class LlmError extends Error {
  constructor(public type: "refusal" | "invalid_output" | "api_error" | "not_configured", message: string) {
    super(message);
    this.name = "LlmError";
  }
}

/**
 * Provider abstraction. Each implementation owns its own tool-use loop using its
 * vendor SDK's native message types (so provider-specific content such as
 * thinking blocks round-trips unchanged); callers only see neutral types.
 */
export interface LlmProvider {
  readonly name: "anthropic" | "openai" | "none";
  readonly model: string;
  /** True when backed by a real model (false for the rule-based fallback). */
  readonly isModel: boolean;
  generateJson<T>(args: { system: string; prompt: string; schema: z.ZodType<T>; name: string; maxTokens?: number }): Promise<T>;
  runAgent(args: {
    system: string;
    history: AgentTurn[];
    userMessage: string;
    tools: ToolSpec[];
    execute: ToolExecutor;
    maxSteps?: number;
  }): Promise<AgentResult>;
}
