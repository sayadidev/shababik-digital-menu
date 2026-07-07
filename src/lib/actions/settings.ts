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

/**
 * Update a single setting. Used by radio groups and toggles for instant saves.
 */
export async function updateSingleSetting(
  field: string,
  value: unknown,
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("site_settings")
    .update({ [field]: value })
    .eq("id", 1);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
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
  const payload = { ...parsed.data, id: 1 };

  // Use upsert so the row always exists; never silently drops columns
  const { error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}
