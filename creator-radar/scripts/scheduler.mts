// Minimal scheduler for self-hosted deployments without Vercel Cron.
// Calls the protected cron endpoint every TICK minutes; the app itself decides
// (from the settings table) whether a scan is due, so ticking often is cheap.
// Usage: APP_URL=https://radar.example.com CRON_SECRET=... npm run scheduler
const appUrl = process.env.APP_URL?.replace(/\/$/, "");
const secret = process.env.CRON_SECRET;
const tickMinutes = Number(process.env.SCHEDULER_TICK_MINUTES || 15);

if (!appUrl || !secret) {
  console.error("APP_URL and CRON_SECRET are required");
  process.exit(1);
}

async function tick() {
  const started = new Date().toISOString();
  try {
    const res = await fetch(`${appUrl}/api/cron/scan`, {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10 * 60_000),
    });
    const body = await res.text();
    console.log(JSON.stringify({ ts: started, status: res.status, body: body.slice(0, 500) }));
  } catch (err) {
    console.error(JSON.stringify({ ts: started, error: String(err) }));
  }
}

await tick();
setInterval(tick, tickMinutes * 60_000);
