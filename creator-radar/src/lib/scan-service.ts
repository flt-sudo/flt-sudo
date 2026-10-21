import "server-only";
import { createLlmClassifier } from "@/lib/discovery/llm";
import { runScan, type ScanOutcome } from "@/lib/discovery/pipeline";
import { createProvider } from "@/lib/discovery/providers";
import { PgRepository, getSql } from "@/lib/discovery/repository-pg";
import { createLogger } from "@/lib/log";
import type { ProviderName, ScanTrigger } from "@/lib/types";

const log = createLogger({ service: "creator-radar" });

export function pipelineRepository() {
  return new PgRepository(getSql());
}

export async function startScan(trigger: ScanTrigger, triggeredBy: string | null): Promise<ScanOutcome> {
  return runScan(
    {
      repo: pipelineRepository(),
      providerFor: createProvider,
      llm: createLlmClassifier(log),
      log,
    },
    { trigger, triggeredBy },
  );
}

export async function testProvider(name: ProviderName) {
  const provider = createProvider(name);
  const result = await provider.healthCheck();
  await pipelineRepository().updateProviderHealth(name, {
    success: result.ok,
    error: result.ok ? undefined : result.message,
    rateLimitRemaining: result.rateLimit?.remaining,
    rateLimitResetAt: result.rateLimit?.resetAt,
  });
  return result;
}

export function integrationStatus() {
  return {
    xConfigured: Boolean(process.env.X_BEARER_TOKEN),
    llmConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    llmModel: process.env.LLM_MODEL || "claude-opus-5-5",
    webhookConfigured: Boolean(process.env.NOTIFY_WEBHOOK_URL),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    cronConfigured: Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 16),
  };
}
