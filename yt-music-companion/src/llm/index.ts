import type { Config } from "../config.js";
import { AnthropicProvider } from "./anthropic.js";
import { HeuristicProvider } from "./heuristic.js";
import { OpenAIProvider } from "./openai.js";
import type { LlmProvider } from "./types.js";

export * from "./types.js";

export function createLlm(cfg: Config): LlmProvider {
  switch (cfg.LLM_PROVIDER) {
    case "anthropic":
      return new AnthropicProvider(cfg.ANTHROPIC_API_KEY!, cfg.ANTHROPIC_MODEL, cfg.ANTHROPIC_EFFORT, cfg.ANTHROPIC_FALLBACKS === "default");
    case "openai":
      return new OpenAIProvider(cfg.OPENAI_API_KEY!, cfg.OPENAI_MODEL);
    default:
      return new HeuristicProvider();
  }
}
