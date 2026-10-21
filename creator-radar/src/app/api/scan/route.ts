import { NextResponse } from "next/server";
import { checkOperator, sameOrigin } from "@/lib/auth";
import { startScan } from "@/lib/scan-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** "Scan now" from the dashboard. Operator-only, same-origin only. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const check = await checkOperator();
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: check.reason === "unauthenticated" ? 401 : 403 });
  }
  try {
    const outcome = await startScan("manual", check.ctx.user.id);
    const status = outcome.status === "locked" ? 409 : 200;
    return NextResponse.json(outcome, { status });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "manual scan crashed", error: String(err) }));
    return NextResponse.json({ error: "Scan failed to start. Check DATABASE_URL and server logs." }, { status: 500 });
  }
}
