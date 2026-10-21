export const CLASSIFICATIONS = [
  "likely_new_launch",
  "possible_new_launch",
  "existing_creator_promotion",
  "needs_review",
] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  likely_new_launch: "Likely new launch",
  possible_new_launch: "Possible new launch",
  existing_creator_promotion: "Existing creator promotion",
  needs_review: "Needs review",
};

export const REVIEW_STATUSES = ["pending", "confirmed", "dismissed"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Awaiting review",
  confirmed: "Confirmed",
  dismissed: "Dismissed",
};

export type ProviderName = "x" | "mock";
export type ScanTrigger = "manual" | "scheduled";
export type ScanStatus = "running" | "succeeded" | "partial" | "failed";
export type EvidenceSource = "post" | "author_profile";

export interface NotificationPreferences {
  webhook_enabled: boolean;
  notify_on: "likely_new_launch" | "any_launch";
}

export interface ProviderConfiguration {
  provider: ProviderName;
  llm_enabled: boolean;
  max_pages_per_query: number;
  max_results_per_page: number;
  retention_days: number;
}

export interface Settings {
  auto_scan_enabled: boolean;
  scan_interval_minutes: number;
  search_terms: string[];
  minimum_confidence: number;
  notification_preferences: NotificationPreferences;
  provider_configuration: ProviderConfiguration;
}

export const DEFAULT_SETTINGS: Settings = {
  auto_scan_enabled: true,
  scan_interval_minutes: 360,
  search_terms: [
    "just launched my onlyfans",
    "finally made an onlyfans",
    "new onlyfans account",
    "my onlyfans is live",
    "just started my OF",
  ],
  minimum_confidence: 0.4,
  notification_preferences: { webhook_enabled: false, notify_on: "likely_new_launch" },
  provider_configuration: {
    provider: "mock",
    llm_enabled: false,
    max_pages_per_query: 2,
    max_results_per_page: 50,
    retention_days: 90,
  },
};

/** A public post, normalized from whichever provider fetched it. Untrusted data. */
export interface NormalizedPost {
  id: string;
  url: string;
  text: string;
  createdAt: string;
  lang?: string;
  isRetweet: boolean;
  /** Fully expanded URLs attached to the post (never t.co wrappers). */
  urls: string[];
  author: {
    id: string;
    username: string;
    name: string;
    profileUrl: string;
    /** Expanded URLs from the author's public profile (website field + bio). */
    profileUrls: string[];
    /** Public bio text; used only for safety screening, never stored. */
    description?: string;
  };
}

export interface ClassificationResult {
  classification: Classification;
  /** Launch-likelihood score in [0, 1]. A heuristic, not a verified probability. */
  confidence: number;
  explanation: string;
  signals: string[];
  claimedLaunchDate: string | null;
  classifier: "rules" | "rules+llm";
  /** Set when the post describes someone else's account (shoutouts, promo pages). */
  thirdParty: boolean;
}
