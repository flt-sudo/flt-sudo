"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { DATA_VIEW_COOKIE } from "@/lib/data/queries";
import { SettingsSchema } from "@/lib/settings";
import { REVIEW_STATUSES } from "@/lib/types";

export interface ActionState {
  ok: boolean;
  message: string;
}

const Uuid = z.string().uuid();

export async function setDataView(view: "live" | "simulated") {
  await requireOperator();
  (await cookies()).set(DATA_VIEW_COOKIE, view === "simulated" ? "simulated" : "live", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

export async function updateReview(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOperator();
  const parsed = z
    .object({
      creatorId: Uuid,
      status: z.enum(REVIEW_STATUSES).optional().or(z.literal("").transform(() => undefined)),
      note: z.string().trim().max(2000).optional(),
    })
    .safeParse({ creatorId: form.get("creatorId"), status: form.get("status") ?? "", note: form.get("note") ?? "" });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const { creatorId, status, note } = parsed.data;
  if (!status && !note) return { ok: false, message: "Choose a status or write a note." };

  if (status) {
    const { error } = await supabase.from("creators").update({ review_status: status }).eq("id", creatorId);
    if (error) return { ok: false, message: error.message };
  }
  const { error } = await supabase
    .from("review_notes")
    .insert({ creator_id: creatorId, author_id: user.id, note: note || null, status_change: status ?? null });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/discoveries");
  return { ok: true, message: status ? "Review status updated." : "Note added." };
}

export async function deleteCreator(form: FormData) {
  const { supabase } = await requireOperator();
  const id = Uuid.safeParse(form.get("creatorId"));
  if (!id.success) throw new Error("Invalid creator id");
  const suppress = form.get("suppress") === "on";
  const { error } = await supabase.rpc("delete_creator", { p_creator_id: id.data, p_suppress: suppress });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/discoveries?deleted=1");
}

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOperator();
  const terms = String(form.get("search_terms") ?? "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  const parsed = SettingsSchema.safeParse({
    auto_scan_enabled: form.get("auto_scan_enabled") === "on",
    scan_interval_minutes: form.get("scan_interval_minutes"),
    search_terms: terms,
    minimum_confidence: Number(form.get("minimum_confidence")) / 100,
    notification_preferences: {
      webhook_enabled: form.get("webhook_enabled") === "on",
      notify_on: form.get("notify_on") || "likely_new_launch",
    },
    provider_configuration: {
      provider: form.get("provider"),
      llm_enabled: form.get("llm_enabled") === "on",
      max_pages_per_query: form.get("max_pages_per_query"),
      max_results_per_page: form.get("max_results_per_page"),
      retention_days: form.get("retention_days"),
    },
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  const { error } = await supabase
    .from("settings")
    .update({ ...parsed.data, updated_by: user.id })
    .eq("id", 1);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

export async function purgeSimulated(): Promise<ActionState> {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase.rpc("purge_simulated_data");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: `Removed ${data ?? 0} simulated creator records.` };
}

export async function signOut() {
  const { supabase } = await requireOperator();
  await supabase.auth.signOut();
  redirect("/login");
}
