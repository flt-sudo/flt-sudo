import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { startScan } from "@/lib/scan-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Called hourly by Vercel Cron (or any scheduler) with `Authorization: Bearer $CRON_SECRET`.
// The configured scan interval and the enable switch are enforced inside runScan.
export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const outcome = await startScan("scheduled", null);
    return NextResponse.json(outcome, { status: outcome.status === "failed" ? 500 : 200 });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "scheduled scan crashed", error: String(err) }));
    return NextResponse.json({ error: "scan failed to start" }, { status: 500 });
  }
}
