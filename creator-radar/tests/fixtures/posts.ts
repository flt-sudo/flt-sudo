// Synthetic, hand-written fixtures. No real accounts or posts.
import type { Classification, EvidenceSource } from "@/lib/types";

export interface ClassifierFixture {
  name: string;
  text: string;
  evidence: EvidenceSource | null;
  expected: Classification;
}

export const POSTED_AT = "2026-10-20T15:00:00.000Z";

export const CLASSIFIER_FIXTURES: ClassifierFixture[] = [
  // Likely new launches
  { name: "classic launch with link", text: "I just launched my OnlyFans today!! 💕 onlyfans.com/fixture_one", evidence: "post", expected: "likely_new_launch" },
  { name: "finally made", text: "ok I finally made an onlyfans… be nice to me 🙈 https://onlyfans.com/fixture_two", evidence: "post", expected: "likely_new_launch" },
  { name: "is live", text: "My OnlyFans is finally live!!! Link below 👇", evidence: "post", expected: "likely_new_launch" },
  { name: "OF abbreviation", text: "just started my OF this morning, come say hi", evidence: "post", expected: "likely_new_launch" },
  { name: "curly quote + bio link", text: "I’ve officially opened my new OnlyFans page today ✨ link in bio", evidence: "author_profile", expected: "likely_new_launch" },

  // Possible new launches (launch language, weaker evidence)
  { name: "new account phrasing", text: "new onlyfans account, link in my bio", evidence: "author_profile", expected: "possible_new_launch" },
  { name: "day one", text: "day 1 of my onlyfans journey 🥹", evidence: "post", expected: "possible_new_launch" },
  { name: "launch without link", text: "I just launched my onlyfans!!", evidence: null, expected: "possible_new_launch" },

  // Existing creator promotion
  { name: "sale", text: "50% off my OnlyFans this weekend only 🔥 onlyfans.com/fixture_three", evidence: "post", expected: "existing_creator_promotion" },
  { name: "new content", text: "New video just dropped on my onlyfans, go watch", evidence: "post", expected: "existing_creator_promotion" },
  { name: "plain subscribe", text: "subscribe to my onlyfans 💋 link in bio", evidence: "author_profile", expected: "existing_creator_promotion" },
  { name: "word 'of' only", text: "the best part of my day is coffee", evidence: null, expected: "existing_creator_promotion" },

  // Needs review (conflicting / indirect)
  { name: "third-party shoutout", text: "She just launched her onlyfans, go support @someone_else", evidence: "post", expected: "needs_review" },
  { name: "tenure conflict", text: "Just launched my new onlyfans page after 2 years on onlyfans, top 1%!", evidence: "post", expected: "needs_review" },
  { name: "backup account", text: "My old account got banned so I just made a new onlyfans, backup account below", evidence: "post", expected: "needs_review" },
];

export const MINOR_FIXTURES = [
  "just launched my onlyfans, I'm 17 lol",
  "16 yo and finally made an OF",
  "new onlyfans account after high school ends",
  "barely legal and just launched",
];

export const ADULT_FALSE_POSITIVE_GUARDS = [
  "I'm 17k followers away from my goal",
  "just launched my onlyfans, 15% off the first month",
  "I just made an onlyfans, posting 12 videos today",
];
