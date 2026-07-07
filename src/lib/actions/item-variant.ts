"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { revalidateMenuPaths } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";
import {
  itemVariantSchema,
  itemVariantUpdateSchema,
} from "@/lib/validations";
import type {
  ItemVariantInput,
  ItemVariantUpdate,
  ItemVariantRow,
} from "@/lib/validations";

export async function getVariants(
  itemId: string,
): Promise<ItemVariantRow[]> {
  await requireAuth();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("item_variants")
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function createVariant(
  data: ItemVariantInput,
): Promise<{ success: boolean; error?: string; data?: ItemVariantRow }> {
  await requireSuperAdmin();
  const parsed = itemVariantSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = createAdminClient();

  const { data: variant, error } = await supabase
    .from("item_variants")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: variant };
}

export async function updateVariant(
  id: string,
  data: ItemVariantUpdate,
): Promise<{ success: boolean; error?: string; data?: ItemVariantRow }> {
  await requireSuperAdmin();
  const parsed = itemVariantUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = createAdminClient();

  const { data: variant, error } = await supabase
    .from("item_variants")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: variant };
}

export async function deleteVariant(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("item_variants").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}

export async function setVariants(
  itemId: string,
  variants: ItemVariantInput[],
): Promise<{ success: boolean; error?: string; data?: ItemVariantRow[] }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const results = variants.map((v) => itemVariantSchema.safeParse(v));
  const invalid = results.find((p) => !p.success);
  if (invalid) {
    return { success: false, error: "One or more variants have invalid data." };
  }

  const { error: deleteError } = await supabase
    .from("item_variants")
    .delete()
    .eq("item_id", itemId);

  if (deleteError) return { success: false, error: deleteError.message };

  if (results.length === 0) {
    revalidatePath("/admin");
    return { success: true, data: [] };
  }

  const validData = results.map((p) => p.data as z.infer<typeof itemVariantSchema>);

  const { data: newVariants, error: insertError } = await supabase
    .from("item_variants")
    .insert(validData)
    .select();

  if (insertError) return { success: false, error: insertError.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: newVariants };
}
