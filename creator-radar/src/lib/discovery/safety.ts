// Conservative screening for any indication that a poster may be under 18.
// A match means the post is dropped entirely: nothing about it is persisted.
// This is a heuristic backstop, not age verification — see README "Limitations".

const MINOR_PATTERNS: Array<[RegExp, string]> = [
  [/\b(1[0-7])\s*(yo|y\/o|y\.o\.?|yrs?\s*old|years?\s*old|year-old)\b/i, "stated age under 18"],
  [/\b(i'?m|im|i am|turning|just turned)\s+(1[0-7])\b(?!\s*(k|%|\$|followers|subs|inch|in\b|cm|min|days?|hours?|posts?|videos?|pics?))/i, "stated age under 18"],
  [/\bage\s*[:=]?\s*(1[0-7])\b/i, "stated age under 18"],
  [/\b(high\s?school|middle\s?school|junior\s?high|homeroom|prom\s?night|freshman\s+year|sophomore|9th\s+grade|10th\s+grade|11th\s+grade|12th\s+grade)\b/i, "school-age reference"],
  [/\b(under\s?age|underaged|minor|jailbait|loli|barely\s?legal)\b/i, "minor-related term"],
  [/\b(teen|teens|teenager|young\s?teen)\b/i, "teen reference"],
];

export interface SafetyResult {
  excluded: boolean;
  reason?: string;
}

/** Screens the post text plus the author's public name and bio. */
export function screenForMinorIndicators(...texts: Array<string | undefined>): SafetyResult {
  for (const text of texts) {
    if (!text) continue;
    for (const [re, reason] of MINOR_PATTERNS) {
      if (re.test(text)) return { excluded: true, reason };
    }
  }
  return { excluded: false };
}
