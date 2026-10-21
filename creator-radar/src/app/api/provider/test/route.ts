import { NextResponse } from "next/server";
import { checkOperator, sameOrigin } from "@/lib/auth";
import { parseSettings } from "@/lib/settings";
import { testProvider } from "@/lib/scan-service";

export const dynamic = "force-dynamic";

/** Runs one minimal, explicitly requested API call to verify provider credentials. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const check = await checkOperator();
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: check.reason === "unauthenticated" ? 401 : 403 });
  }
  const { data } = await check.ctx.supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  const settings = parseSettings(data);
  try {
    const result = await testProvider(settings.provider_configuration.provider);
    return NextResponse.json({ provider: settings.provider_configuration.provider, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
