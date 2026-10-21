import { expect, test, type Page } from "@playwright/test";

// Full operator workflow against a real Supabase project (or local stack).
// Requires E2E_EMAIL / E2E_PASSWORD for an operator account; optionally
// E2E_OUTSIDER_EMAIL / E2E_OUTSIDER_PASSWORD for a signed-in non-operator.
// Uses the mock provider, so it only creates simulated records.

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

async function login(page: Page, user: string, pass: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user);
  await page.getByLabel("Password").fill(pass);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("operator workflow", () => {
  test.skip(!email || !password, "E2E_EMAIL and E2E_PASSWORD not set");

  test("rejects a wrong password with a generic message", async ({ page }) => {
    await login(page, email!, "definitely-wrong-password");
    await expect(page.getByText("Sign-in failed. Check your credentials.")).toBeVisible();
  });

  test("sign in, scan, review evidence, confirm, and delete", async ({ page }) => {
    await login(page, email!, password!);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    // Use the simulated provider for a deterministic run.
    await page.getByRole("link", { name: "Scan control", exact: true }).click();
    await page.getByLabel("Data provider").selectOption("mock");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Settings saved.")).toBeVisible();
    await page.getByRole("button", { name: "Simulated", exact: true }).click();
    await expect(page.getByText(/viewing simulated data/i)).toBeVisible();

    await page.getByRole("button", { name: "Scan now" }).click();
    await expect(page.getByRole("status")).toHaveText(/Scan complete \(simulated\)|Scan (succeeded|partial)/, { timeout: 60_000 });
    await expect(page.getByRole("table").last().getByText("manual").first()).toBeVisible();

    // A second scan is idempotent: nothing new from the same window.
    await page.getByRole("button", { name: "Scan now" }).click();
    await expect(page.getByRole("status")).toHaveText(/0 new profiles/, { timeout: 60_000 });

    await page.getByRole("link", { name: "Discoveries", exact: true }).click();
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toContainText("@sim_");
    await expect(rows.first()).toContainText("Simulated");

    // Filtering by classification.
    await page.getByLabel("Classification").selectOption("likely_new_launch");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/classification=likely_new_launch/);
    for (const row of await rows.all()) await expect(row).toContainText("Likely new launch");

    // Detail view with evidence.
    await rows.first().getByRole("link").first().click();
    await expect(page.getByRole("heading", { name: /@sim_/ })).toBeVisible();
    await expect(page.getByText("Evidence timeline")).toBeVisible();
    await expect(page.locator("blockquote").first()).toBeVisible();
    // Simulated records are never linked out.
    await expect(page.locator('a[href^="https://onlyfans.com"]')).toHaveCount(0);

    await page.getByLabel("Review status").selectOption("confirmed");
    await page.getByLabel("Note").fill("Checked the public announcement.");
    await page.getByRole("button", { name: "Save review" }).click();
    await expect(page.getByText("Review status updated.")).toBeVisible();
    await expect(page.getByText("Checked the public announcement.")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete creator and evidence" }).click();
    await expect(page).toHaveURL(/\/discoveries\?deleted=1/);
    await expect(page.getByText("Creator and associated evidence deleted.")).toBeVisible();
  });
});

test.describe("non-operator", () => {
  const outsider = process.env.E2E_OUTSIDER_EMAIL;
  const outsiderPass = process.env.E2E_OUTSIDER_PASSWORD;
  test.skip(!outsider || !outsiderPass, "E2E_OUTSIDER_EMAIL and E2E_OUTSIDER_PASSWORD not set");

  test("a signed-in user who is not an operator cannot see the dashboard", async ({ page, request }) => {
    await login(page, outsider!, outsiderPass!);
    await expect(page).toHaveURL(/\/login\?error=not_operator/);
    await expect(page.getByText(/not an operator/)).toBeVisible();
    const res = await page.request.post("/api/scan", { headers: { origin: new URL(page.url()).origin } });
    expect(res.status()).toBe(403);
    void request;
  });
});
