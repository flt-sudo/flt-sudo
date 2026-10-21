import { expect, test } from "@playwright/test";

// Access control that holds with or without a configured Supabase project.

test("signed-out visitors are redirected to the login page", async ({ page }) => {
  for (const path of ["/", "/discoveries", "/scans", "/creators/00000000-0000-0000-0000-000000000000"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
  await expect(page.getByRole("heading", { name: "Creator Radar" })).toBeVisible();
});

test("API endpoints reject unauthenticated callers", async ({ request }) => {
  expect((await request.post("/api/scan")).status()).toBe(401);
  expect((await request.post("/api/provider/test")).status()).toBe(401);
});

test("the cron endpoint requires the shared secret", async ({ request }) => {
  expect((await request.get("/api/cron/scan")).status()).toBe(401);
  expect((await request.get("/api/cron/scan", { headers: { authorization: "Bearer wrong-secret-value-123" } })).status()).toBe(401);
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/login");
  expect(res.headers()["x-frame-options"]).toBe("DENY");
  expect(res.headers()["referrer-policy"]).toBe("no-referrer");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});
