// Rule-based launch classification. Deterministic, explainable, and the
// baseline the optional LLM pass can refine but never bypass.

import type { Classification, ClassificationResult, EvidenceSource } from "@/lib/types";

export interface ClassifyInput {
  text: string;
  publishedAt: string;
  /** Where the creator-profile link was found, or null when there is none. */
  evidence: EvidenceSource | null;
}

const P = "ofplatform";

/** Collapses the many ways the platform is written into a single token. */
export function normalizeForClassification(raw: string): string {
  let t = raw
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/(?:https?:\/\/)?(?:www\.)?onlyfans\.com\/\S*/gi, ` ${P}link `)
    // "OF" only counts when written in capitals, so the English word "of" is never matched.
    .replace(/(^|[^A-Za-z0-9])OF(?=$|[^A-Za-z0-9])/g, `$1${P}`);
  t = t.toLowerCase();
  t = t.replace(/\b(?:0|o)nly\s?f(?:a|4)ns?\b/g, P).replace(/\bonlyfan\b/g, P);
  return t.replace(/\s+/g, " ").trim();
}

interface Signal {
  id: string;
  weight: number;
  re: RegExp;
  reason: string;
  kind: "launch_strong" | "launch_medium" | "recency" | "evidence" | "promo" | "tenure" | "third_party" | "relaunch";
}

const SIGNALS: Signal[] = [
  {
    id: "launch_verb",
    kind: "launch_strong",
    weight: 0.45,
    re: new RegExp(`\\b(just|finally|officially|today|i|i've|ive|i have|we)\\s+(just\\s+|finally\\s+|officially\\s+)?(launched|started|opened|made|created|joined|set up|signed up for)\\s+(my|an|a|our)?\\s*(very\\s+)?(own\\s+)?(new\\s+|first\\s+)?${P}\\b`),
    reason: "first-person announcement of launching an account",
  },
  {
    id: "is_live",
    kind: "launch_strong",
    weight: 0.45,
    re: new RegExp(`\\b(my|our)\\s+(new\\s+|first\\s+)?${P}\\s+(account\\s+|page\\s+)?(is|is now|just went|went|is finally|is officially)\\s+(finally\\s+|officially\\s+|now\\s+)?(live|up|open|launched|here)\\b`),
    reason: "states their account is now live",
  },
  {
    id: "new_account",
    kind: "launch_medium",
    weight: 0.3,
    re: new RegExp(`\\b(new|brand new)\\s+${P}\\s*(account|page)?\\b|\\b${P}\\s+(account|page)\\s+(is\\s+)?new\\b`),
    reason: "describes a new account",
  },
  {
    id: "first_day",
    kind: "launch_medium",
    weight: 0.25,
    re: new RegExp(`\\b(day\\s*(1|one)|first\\s+(ever\\s+)?(post|day|week|upload))\\b.{0,40}${P}|${P}.{0,40}\\b(day\\s*(1|one)|first\\s+(ever\\s+)?(post|day|week|upload))\\b`),
    reason: "mentions first post or first day on the platform",
  },
  {
    id: "recency",
    kind: "recency",
    weight: 0.1,
    re: /\b(today|tonight|just now|this morning|yesterday|finally|officially|at last)\b/,
    reason: "recency language",
  },
  {
    id: "third_party_possessive",
    kind: "third_party",
    weight: -0.25,
    re: new RegExp(`\\b(her|his|their)\\s+(new\\s+|first\\s+)?${P}\\b|\\b(she|he|they)\\s+(just\\s+|finally\\s+)?(launched|started|made|opened)\\b`),
    reason: "refers to someone else's account",
  },
  {
    id: "shoutout",
    kind: "third_party",
    weight: -0.2,
    re: /\b(shout\s?out|s4s|sfs|promo (page|account)|go (follow|sub(scribe)?( to)?|support|check out) @\w+)\b/,
    reason: "shoutout or promotion-page language",
  },
  {
    id: "tenure",
    kind: "tenure",
    weight: -0.4,
    re: new RegExp(`\\b(been|i've been|ive been|have been)\\s+on\\s+${P}\\s+for\\b|\\banniversary\\b|\\btop\\s*\\d+(\\.\\d+)?\\s*%|\\b(\\d+|one|two|three|a)\\s+(years?|months?)\\s+(on|of)\\s+(my\\s+)?${P}\\b`),
    reason: "indicates an established account (tenure, ranking or anniversary)",
  },
  {
    id: "new_content",
    kind: "promo",
    weight: -0.2,
    re: /\bnew\s+(content|video|vid|vids|videos|post|posts|pics?|photos?|set|upload|ppv|drop|collab)\b/,
    reason: "promotes new content rather than a new account",
  },
  {
    id: "discount",
    kind: "promo",
    weight: -0.1,
    re: /\b\d{1,2}\s?%\s?off\b|\bsale\b|\bdiscount(ed)?\b|\bpromo code\b|\brenew(al)?\b/,
    reason: "discount or renewal promotion",
  },
  {
    id: "relaunch",
    kind: "relaunch",
    weight: -0.1,
    re: /\b(backup|back-up|back up)\s+(account|page)\b|\b(old|previous) (account|page) (got )?(banned|deleted|hacked|removed)\b|\bmy (new|second|2nd|other|backup) account\b.*\b(banned|deleted|hacked)\b/,
    reason: "possible replacement or backup account",
  },
];

const FIRST_PERSON = /\b(i|i'm|im|i've|ive|my|me|we|our)\b/;
const PLATFORM = new RegExp(`\\b${P}(link)?\\b`);

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Only dates the poster states (relative to the post time) — never inferred account age. */
export function extractClaimedLaunchDate(normalized: string, publishedAt: string): string | null {
  const posted = new Date(publishedAt);
  if (Number.isNaN(posted.getTime())) return null;
  const explicit = normalized.match(
    /\b(?:launched|started|opened|live|went live)\s+(?:on\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (explicit) {
    const month = MONTHS[explicit[1]];
    const day = Number(explicit[2]);
    let year = posted.getUTCFullYear();
    let d = new Date(Date.UTC(year, month, day));
    if (d.getTime() > posted.getTime() + 86_400_000) d = new Date(Date.UTC(--year, month, day));
    if (d.getUTCDate() === day) return isoDate(d);
  }
  if (/\byesterday\b/.test(normalized)) return isoDate(new Date(posted.getTime() - 86_400_000));
  if (/\b(today|tonight|this morning|just now|just (launched|started|opened|made|went live))\b/.test(normalized)) {
    return isoDate(posted);
  }
  return null;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function classifyPost(input: ClassifyInput): ClassificationResult {
  const text = normalizeForClassification(input.text);
  const matched = SIGNALS.filter((s) => s.re.test(text));
  const has = (kind: Signal["kind"]) => matched.some((s) => s.kind === kind);

  const mentionsPlatform = PLATFORM.test(text) || input.evidence !== null;
  const launchStrong = has("launch_strong");
  const launchAny = launchStrong || has("launch_medium");
  const firstPerson = FIRST_PERSON.test(text);
  const thirdParty = has("third_party");
  const tenure = has("tenure");
  const relaunch = has("relaunch");

  let score = 0.2 + matched.reduce((sum, s) => sum + s.weight, 0);
  const reasons = matched.map((s) => s.reason);
  if (input.evidence === "post") {
    score += 0.15;
    reasons.push("post links directly to a creator profile");
  } else if (input.evidence === "author_profile") {
    score += 0.05;
    reasons.push("creator profile linked from the author's public X profile");
  } else {
    reasons.push("no creator-profile link found");
  }
  if (launchAny && !firstPerson) {
    score -= 0.15;
    reasons.push("no first-person language");
  }
  if (!mentionsPlatform) score -= 0.3;
  score = Math.min(0.98, Math.max(0.02, score));

  let classification: Classification;
  if (!launchAny || !mentionsPlatform) {
    // Someone announcing *another* person's launch is worth a human look.
    const thirdPartyLaunch = thirdParty && /\b(launched|started|made|opened|joined)\b/.test(text);
    classification = thirdPartyLaunch && mentionsPlatform ? "needs_review" : "existing_creator_promotion";
    score = Math.min(score, 0.35);
  } else if (thirdParty || (tenure && launchAny) || relaunch) {
    classification = "needs_review";
    reasons.push("conflicting or indirect signals");
  } else if (launchStrong && firstPerson && input.evidence !== null && score >= 0.75) {
    classification = "likely_new_launch";
  } else if (score >= 0.45) {
    classification = "possible_new_launch";
  } else {
    classification = "needs_review";
  }

  // "Needs review" means the signals conflict, so the score must not read as high certainty.
  if (classification === "needs_review") score = Math.min(score, 0.6);

  const explanation = `${reasons.slice(0, 6).join("; ")}.`.replace(/^./, (c) => c.toUpperCase());
  return {
    classification,
    confidence: round3(score),
    explanation,
    signals: matched.map((s) => s.id),
    claimedLaunchDate: launchAny ? extractClaimedLaunchDate(text, input.publishedAt) : null,
    classifier: "rules",
    thirdParty,
  };
}
