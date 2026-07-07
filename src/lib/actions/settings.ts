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

  // Build payload — omit enable_usd if column may not exist yet
  const payload: Record<string, unknown> = { ...parsed.data };
  const hasUsdColumn = "enable_usd" in parsed.data;

  // Try update with enable_usd first
  const { error } = await supabase
    .from("site_settings")
    .update(payload)
    .eq("id", 1);

  if (error) {
    if (hasUsdColumn) {
      // enable_usd column may not exist yet — retry without it
      delete payload.enable_usd;
      const { error: retry1 } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", 1);
      if (retry1) {
        delete payload.tier;
        delete payload.ordering_enabled;
        const { error: retry2 } = await supabase
          .from("site_settings")
          .update(payload)
          .eq("id", 1);
        if (retry2) return { success: false, error: retry2.message };
      }
    } else {
      delete payload.tier;
      delete payload.ordering_enabled;
      const { error: retry2 } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", 1);
      if (retry2) return { success: false, error: retry2.message };
    }
  }

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}
