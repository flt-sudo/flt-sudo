import { z } from "zod";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";
import { sanitizeTerms } from "@/lib/discovery/query";

export const NotificationPreferencesSchema = z.object({
  webhook_enabled: z.boolean().default(false),
  notify_on: z.enum(["likely_new_launch", "any_launch"]).default("likely_new_launch"),
});

export const ProviderConfigurationSchema = z.object({
  provider: z.enum(["x", "mock"]).default("mock"),
  llm_enabled: z.boolean().default(false),
  max_pages_per_query: z.coerce.number().int().min(1).max(10).default(2),
  max_results_per_page: z.coerce.number().int().min(10).max(100).default(50),
  retention_days: z.coerce.number().int().min(1).max(3650).default(90),
});

export const SettingsSchema = z.object({
  auto_scan_enabled: z.boolean(),
  scan_interval_minutes: z.coerce.number().int().min(15).max(10080),
  search_terms: z
    .array(z.string())
    .transform(sanitizeTerms)
    .pipe(z.array(z.string()).min(1, "At least one search term is required").max(25)),
  minimum_confidence: z.coerce.number().min(0).max(1),
  notification_preferences: NotificationPreferencesSchema,
  provider_configuration: ProviderConfigurationSchema,
});

/** Parses a settings row from the database, falling back to defaults field by field. */
export function parseSettings(row: unknown): Settings {
  const r = (row ?? {}) as Record<string, unknown>;
  const merged = {
    auto_scan_enabled: r.auto_scan_enabled ?? DEFAULT_SETTINGS.auto_scan_enabled,
    scan_interval_minutes: r.scan_interval_minutes ?? DEFAULT_SETTINGS.scan_interval_minutes,
    search_terms: r.search_terms ?? DEFAULT_SETTINGS.search_terms,
    minimum_confidence: r.minimum_confidence ?? DEFAULT_SETTINGS.minimum_confidence,
    notification_preferences: { ...DEFAULT_SETTINGS.notification_preferences, ...(r.notification_preferences as object) },
    provider_configuration: { ...DEFAULT_SETTINGS.provider_configuration, ...(r.provider_configuration as object) },
  };
  const parsed = SettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}
