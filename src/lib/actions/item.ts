"use server";

import { revalidatePath } from "next/cache";
import { revalidateMenuPaths } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";
import { itemSchema, itemUpdateSchema } from "@/lib/validations";
import type {
  ItemInput,
  ItemUpdate,
  ItemRow,
  ItemVariantRow,
} from "@/lib/validations";

/** Convert Arabic-Indic digits (٠-٩) to Western digits (0-9) */
function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x0660 + 0x0030));
}

type ItemWithCategory = ItemRow & {
  category_name_en: string;
  category_name_ar: string;
};

export async function getItems(
  categoryId?: string,
): Promise<ItemWithCategory[]> {
  await requireAuth();
  const supabase = createAdminClient();

  let query = supabase
    .from("items")
    .select("*, categories(name_en, name_ar)")
    .order("is_bestseller", { ascending: false })
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (item: Record<string, unknown> & { categories?: { name_en: string; name_ar: string } | null }) => ({
      ...item,
      category_name_en: item.categories?.name_en ?? "",
      category_name_ar: item.categories?.name_ar ?? "",
      categories: undefined,
    }),
  ) as unknown as ItemWithCategory[];
}

type ItemWithVariantsAndImages = ItemRow & {
  variants: ItemVariantRow[];
  item_images: { id: string; image_url: string; sort_order: number }[];
};

export async function getItem(
  id: string,
): Promise<ItemWithVariantsAndImages> {
  await requireAuth();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("items")
    .select("*, item_variants(*), item_images(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Item not found");

  const item = data as Record<string, unknown> & {
    item_variants?: ItemVariantRow[];
    item_images?: { id: string; image_url: string; sort_order: number }[];
  };

  return {
    ...item,
    variants: item.item_variants ?? [],
    item_images: item.item_images ?? [],
    item_variants: undefined,
  } as unknown as ItemWithVariantsAndImages;
}

export async function createItem(
  data: ItemInput,
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  await requireSuperAdmin();
  const normalized: ItemInput = { ...data, name_ar: normalizeDigits(data.name_ar), description_ar: normalizeDigits(data.description_ar) };
  const parsed = itemSchema.safeParse(normalized);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = createAdminClient();

  const { data: item, error } = await supabase
    .from("items")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: item };
}

export async function updateItem(
  id: string,
  data: ItemUpdate,
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  await requireSuperAdmin();
  const normalized: ItemUpdate = {
    ...data,
    ...(data.name_ar !== undefined ? { name_ar: normalizeDigits(data.name_ar) } : {}),
    ...(data.description_ar !== undefined ? { description_ar: normalizeDigits(data.description_ar) } : {}),
  };
  const parsed = itemUpdateSchema.safeParse(normalized);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = createAdminClient();

  const { data: item, error } = await supabase
    .from("items")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: item };
}

export async function deleteItem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { error: variantError } = await supabase
    .from("item_variants")
    .delete()
    .eq("item_id", id);

  if (variantError) return { success: false, error: variantError.message };

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}

export async function toggleActive(
  id: string,
  newValue: boolean,
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { data: item, error } = await supabase
    .from("items")
    .update({ is_active: newValue })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  if (!item) return { success: false, error: "Item not found" };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: item };
}

export async function setOfferPosition(
  id: string,
  position: number | null,
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  // Clear this position from any other item first
  if (position !== null) {
    const { error: clearError } = await supabase
      .from("items")
      .update({ is_offer: false, offer_position: null })
      .eq("offer_position", position)
      .neq("id", id);

    if (clearError) return { success: false, error: clearError.message };
  }

  const { data: item, error } = await supabase
    .from("items")
    .update({ is_offer: position !== null, offer_position: position })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  if (!item) return { success: false, error: "Item not found" };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: item };
}

export async function toggleBestseller(
  id: string,
  newValue: boolean,
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { data: item, error } = await supabase
    .from("items")
    .update({ is_bestseller: newValue })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  if (!item) return { success: false, error: "Item not found" };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: item };
}
