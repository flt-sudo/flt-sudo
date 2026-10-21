import { describe, expect, it } from "vitest";
import { mergeLlmResult } from "@/lib/discovery/llm";
import { classifyPost } from "@/lib/discovery/classify";
import { notifyScanComplete, validWebhookUrl } from "@/lib/discovery/notify";
import { silentLogger } from "@/lib/log";

const AT = "2026-10-20T12:00:00.000Z";

describe("mergeLlmResult (containment of model output)", () => {
  it("cannot promote to likely without a profile link", () => {
    const rules = classifyPost({ text: "I just launched my onlyfans", publishedAt: AT, evidence: null });
    const out = mergeLlmResult(rules, { classification: "likely_new_launch", confidence: 1, explanation: "x", claimed_launch_date: null }, null);
    expect(out.classification).toBe("possible_new_launch");
  });

  it("cannot clear a third-party flag", () => {
    const rules = classifyPost({ text: "she just launched her onlyfans", publishedAt: AT, evidence: "post" });
    const out = mergeLlmResult(rules, { classification: "likely_new_launch", confidence: 0.99, explanation: "x", claimed_launch_date: null }, "post");
    expect(out.classification).toBe("needs_review");
  });

  it("clamps and blends confidence, capped below certainty", () => {
    const rules = classifyPost({ text: "new onlyfans account", publishedAt: AT, evidence: "post" });
    const out = mergeLlmResult(rules, { classification: "possible_new_launch", confidence: 7, explanation: "x", claimed_launch_date: null }, "post");
    expect(out.confidence).toBeLessThanOrEqual(0.95);
    expect(out.classifier).toBe("rules+llm");
  });

  it("sanitizes the model explanation and rejects future or malformed dates", () => {
    const rules = classifyPost({ text: "new onlyfans account", publishedAt: AT, evidence: "post" });
    const out = mergeLlmResult(
      rules,
      { classification: "possible_new_launch", confidence: 0.5, explanation: "<script>alert(1)</script>\u0007ok", claimed_launch_date: "2030-01-01" },
      "post",
      AT,
    );
    expect(out.explanation).not.toMatch(/[<>\u0007]/);
    expect(out.claimedLaunchDate).toBeNull();
    const bad = mergeLlmResult(rules, { classification: "possible_new_launch", confidence: 0.5, explanation: "", claimed_launch_date: "yesterday" }, "post", AT);
    expect(bad.claimedLaunchDate).toBeNull();
  });
});

describe("notifications", () => {
  it("only accepts https webhooks without credentials", () => {
    expect(validWebhookUrl("https://hooks.example.test/abc")).toBeTruthy();
    expect(validWebhookUrl("http://hooks.example.test/abc")).toBeNull();
    expect(validWebhookUrl("https://u:p@hooks.example.test")).toBeNull();
    expect(validWebhookUrl("nonsense")).toBeNull();
  });

  it("sends counts only, never creator details", async () => {
    process.env.NOTIFY_WEBHOOK_URL = "https://hooks.example.test/abc";
    let body = "";
    const ok = await notifyScanComplete(
      { webhook_enabled: true, notify_on: "likely_new_launch" },
      { runId: "r", isSimulated: true, newProfiles: 3, newLikely: 2, status: "succeeded" },
      silentLogger,
      (async (_u: unknown, init?: RequestInit) => {
        body = String(init?.body);
        return new Response("ok");
      }) as typeof fetch,
    );
    expect(ok).toBe(true);
    expect(body).toContain("2 likely new launches");
    expect(body).toContain("SIMULATED");
    delete process.env.NOTIFY_WEBHOOK_URL;
  });

  it("does nothing when disabled", async () => {
    process.env.NOTIFY_WEBHOOK_URL = "https://hooks.example.test/abc";
    const ok = await notifyScanComplete(
      { webhook_enabled: false, notify_on: "any_launch" },
      { runId: "r", isSimulated: false, newProfiles: 3, newLikely: 2, status: "succeeded" },
      silentLogger,
      (async () => { throw new Error("should not be called"); }) as typeof fetch,
    );
    expect(ok).toBe(false);
    delete process.env.NOTIFY_WEBHOOK_URL;
  });
});
