"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: { error: string | null }, form: FormData): Promise<{ error: string | null }> {
  const parsed = z
    .object({ email: z.string().email().max(320), password: z.string().min(1).max(200) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Generic message: do not reveal whether the account exists.
  if (error) return { error: "Sign-in failed. Check your credentials." };
  redirect("/");
}
