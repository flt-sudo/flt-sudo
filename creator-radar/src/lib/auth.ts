import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface OperatorContext {
  supabase: SupabaseServerClient;
  user: { id: string; email: string | null };
}

export type OperatorCheck =
  | { ok: true; ctx: OperatorContext }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/**
 * Verifies the session with Supabase Auth (not just the cookie) and that the
 * user is listed in `operators`. Server-side source of truth for access.
 */
export async function checkOperator(): Promise<OperatorCheck> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false, reason: "unauthenticated" };
  const { data: isOperator } = await supabase.rpc("is_operator");
  if (isOperator !== true) return { ok: false, reason: "forbidden" };
  return { ok: true, ctx: { supabase, user: { id: data.user.id, email: data.user.email ?? null } } };
}

/** For pages and server actions: redirects instead of returning on failure. */
export async function requireOperator(): Promise<OperatorContext> {
  const check = await checkOperator();
  if (!check.ok) redirect(check.reason === "unauthenticated" ? "/login" : "/login?error=not_operator");
  return check.ctx;
}

/** For route handlers: rejects cross-site requests to state-changing endpoints. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === new URL(request.url).host || origin === process.env.APP_URL?.replace(/\/$/, "");
  } catch {
    return false;
  }
}
