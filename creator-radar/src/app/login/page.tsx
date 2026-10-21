import { Radar } from "lucide-react";
import { supabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Radar className="size-4" />
          </span>
          <div>
            <h1 className="text-base font-semibold">Creator Radar</h1>
            <p className="text-xs text-muted-foreground">Private dashboard — operators only</p>
          </div>
        </div>
        {error === "not_operator" && (
          <p className="mb-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            This account is signed in but is not an operator. Ask an admin to run{" "}
            <code className="font-mono">npm run operator:add</code> for your email.
          </p>
        )}
        {supabaseConfigured() ? (
          <LoginForm />
        ) : (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see README).
          </p>
        )}
      </div>
    </main>
  );
}
