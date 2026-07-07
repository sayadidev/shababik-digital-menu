"use server";

import { revalidatePath } from "next/cache";
import { revalidateMenuPaths } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";
import { siteSettingsSchema } from "@/lib/validations";
import type { SiteSettingsInput, SiteSettingsRow } from "@/lib/validations";

export async function getSettings(): Promise<SiteSettingsRow | null> {
  await requireAuth();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return null;
  return data;
}

export async function updateSettings(
  data: SiteSettingsInput,
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const parsed = siteSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = createAdminClient();

  // Build payload — omit newer columns if they may not exist yet
  const payload: Record<string, unknown> = { ...parsed.data };

  const tryUpdate = async (p: Record<string, unknown>): Promise<boolean> => {
    const { error } = await supabase
      .from("site_settings")
      .update(p)
      .eq("id", 1);
    return !error;
  };

  if (await tryUpdate(payload)) {
    revalidatePath("/admin");
    revalidateMenuPaths();
    return { success: true };
  }

  // Column fallbacks — remove newer columns and retry
  delete payload.active_currency;
  if (await tryUpdate(payload)) {
    revalidatePath("/admin");
    revalidateMenuPaths();
    return { success: true };
  }

  delete payload.enable_usd;
  if (await tryUpdate(payload)) {
    revalidatePath("/admin");
    revalidateMenuPaths();
    return { success: true };
  }

  delete payload.tier;
  delete payload.ordering_enabled;
  const { error: retry3 } = await supabase
    .from("site_settings")
    .update(payload)
    .eq("id", 1);
  if (retry3) return { success: false, error: retry3.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}
