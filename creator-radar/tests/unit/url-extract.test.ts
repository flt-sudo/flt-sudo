import { describe, expect, it } from "vitest";
import {
  extractCreatorProfiles,
  parseCreatorProfileUrl,
  safeExternalUrl,
  xPostUrl,
  xProfileUrl,
} from "@/lib/discovery/url-extract";
import { screenForMinorIndicators } from "@/lib/discovery/safety";
import { ADULT_FALSE_POSITIVE_GUARDS, MINOR_FIXTURES } from "../fixtures/posts";

describe("parseCreatorProfileUrl", () => {
  it.each([
    ["https://onlyfans.com/fixture_one", "fixture_one"],
    ["https://www.onlyfans.com/Fixture.Two?ref=x#top", "fixture.two"],
    ["onlyfans.com/fixture-three", "fixture-three"],
    ["http://onlyfans.com/fixture_four/media", "fixture_four"],
    ["https://onlyfans.com/@fixture5", "fixture5"],
  ])("%s → %s", (input, slug) => {
    expect(parseCreatorProfileUrl(input)).toEqual({ slug, url: `https://onlyfans.com/${slug}` });
  });

  it.each([
    "https://onlyfans.com/",
    "https://onlyfans.com/my/subscribers",
    "https://onlyfans.com/terms",
    "https://onlyfans.com/123456/fixture",
    "https://onlyfans.com.evil.example/fixture",
    "https://evil.example/onlyfans.com/fixture",
    "https://user:pass@onlyfans.com/fixture",
    "https://onlyfans.com:8443/fixture",
    "javascript:alert(1)//onlyfans.com/x",
    "https://onlyfans.com/%3Cscript%3E",
    "https://linktr.ee/fixture",
    "not a url",
  ])("rejects %s", (input) => {
    expect(parseCreatorProfileUrl(input)).toBeNull();
  });
});

describe("extractCreatorProfiles", () => {
  it("combines entity URLs and bare text mentions, deduplicated by slug", () => {
    const found = extractCreatorProfiles(
      ["https://t.co/abc", "https://onlyfans.com/Fixture_One"],
      "come see me at onlyfans.com/fixture_one! or onlyfans.com/fixture_two.",
    );
    expect(found.map((p) => p.slug)).toEqual(["fixture_one", "fixture_two"]);
  });
});

describe("X URL builders", () => {
  it("builds canonical URLs", () => {
    expect(xProfileUrl("fixture_handle")).toBe("https://x.com/fixture_handle");
    expect(xPostUrl("fixture_handle", "1234567890")).toBe("https://x.com/fixture_handle/status/1234567890");
  });
  it("refuses malformed input", () => {
    expect(() => xProfileUrl("bad handle")).toThrow();
    expect(() => xPostUrl("ok", "12a")).toThrow();
  });
});

describe("safeExternalUrl", () => {
  it("allows only canonical shapes", () => {
    expect(safeExternalUrl("https://x.com/abc/status/1")).toBe("https://x.com/abc/status/1");
    expect(safeExternalUrl("https://onlyfans.com/abc")).toBe("https://onlyfans.com/abc");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("https://x.com/abc/status/1?x=<script>")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
  });
});

describe("screenForMinorIndicators", () => {
  it.each(MINOR_FIXTURES)("excludes: %s", (text) => {
    expect(screenForMinorIndicators(text).excluded).toBe(true);
  });
  it.each(ADULT_FALSE_POSITIVE_GUARDS)("does not exclude: %s", (text) => {
    expect(screenForMinorIndicators(text).excluded).toBe(false);
  });
  it("checks every text passed (e.g. bio)", () => {
    expect(screenForMinorIndicators("just launched", undefined, "17 y/o").excluded).toBe(true);
  });
});
