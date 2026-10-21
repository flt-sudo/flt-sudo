// Extraction and validation of public profile URLs. All input here is untrusted.

const ONLYFANS_HOSTS = new Set(["onlyfans.com", "www.onlyfans.com"]);

/** First path segments on onlyfans.com that are site pages, not creator profiles. */
const RESERVED_PATHS = new Set([
  "my", "action", "actions", "api", "api2", "about", "help", "terms", "privacy",
  "legal", "faq", "contact", "support", "login", "signup", "register", "home",
  "posts", "files", "chats", "messages", "notifications", "settings", "search",
  "explore", "collections", "bookmarks", "lists", "subscriptions", "subscribers",
  "statements", "payout", "payouts", "transparency", "complaints", "dmca", "usc2257",
  "aup", "contract", "cookies", "brand", "blog", "careers", "how", "of-tv", "oftv",
  "referrals", "ofstream", "verify", "auth", "s", "u",
]);

const SLUG_RE = /^[a-z0-9._-]{2,60}$/;
const X_HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const POST_ID_RE = /^[0-9]{1,25}$/;

export interface ExtractedProfile {
  url: string;
  slug: string;
}

/** Returns the canonical `https://onlyfans.com/<slug>` form, or null if not a creator profile. */
export function parseCreatorProfileUrl(raw: string): ExtractedProfile | null {
  let candidate = raw.trim();
  if (!candidate || candidate.length > 300) return null;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.port) return null;
  if (!ONLYFANS_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  let first: string;
  try {
    first = decodeURIComponent(segments[0]);
  } catch {
    return null;
  }
  const slug = first.replace(/^@/, "").toLowerCase();
  if (!SLUG_RE.test(slug) || RESERVED_PATHS.has(slug)) return null;
  // Deep links like /<slug>/media are fine; /<numeric-id>/... post links are not profiles.
  if (/^[0-9]+$/.test(slug)) return null;
  return { url: `https://onlyfans.com/${slug}`, slug };
}

const BARE_PROFILE_IN_TEXT = /(?:https?:\/\/)?(?:www\.)?onlyfans\.com\/[^\s"'<>()\]]+/gi;

/**
 * Finds creator-profile URLs among a post's expanded URLs and any bare
 * `onlyfans.com/...` mentions in its text. De-duplicated by slug, order kept.
 */
export function extractCreatorProfiles(urls: string[], text = ""): ExtractedProfile[] {
  const out = new Map<string, ExtractedProfile>();
  const candidates = [...urls, ...(text.match(BARE_PROFILE_IN_TEXT) ?? [])];
  for (const c of candidates) {
    const parsed = parseCreatorProfileUrl(c.replace(/[.,!?;:]+$/, ""));
    if (parsed && !out.has(parsed.slug)) out.set(parsed.slug, parsed);
  }
  return [...out.values()];
}

export function isValidXHandle(handle: string): boolean {
  return X_HANDLE_RE.test(handle);
}

export function isValidPostId(id: string): boolean {
  return POST_ID_RE.test(id);
}

export function xProfileUrl(handle: string): string {
  if (!isValidXHandle(handle)) throw new Error("invalid X handle");
  return `https://x.com/${handle}`;
}

export function xPostUrl(handle: string, postId: string): string {
  if (!isValidXHandle(handle) || !isValidPostId(postId)) throw new Error("invalid X post reference");
  return `https://x.com/${handle}/status/${postId}`;
}

const SAFE_LINK_PATTERNS = [
  /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}(\/status\/[0-9]{1,25})?$/,
  /^https:\/\/onlyfans\.com\/[a-z0-9._-]{2,60}$/,
];

/** Only URLs in one of the exact canonical shapes the app itself produces may be rendered as links. */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return SAFE_LINK_PATTERNS.some((re) => re.test(raw)) ? raw : null;
}
