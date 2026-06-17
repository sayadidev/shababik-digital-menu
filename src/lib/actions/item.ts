"use server";

import { revalidatePath } from "next/cache";
import { revalidateMenuPaths } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { itemSchema, itemUpdateSchema } from "@/lib/validations";
import type {
  ItemInput,
  ItemUpdate,
  ItemRow,
  ItemVariantRow,
} from "@/lib/validations";

type ItemWithCategory = ItemRow & {
  category_name_en: string;
  category_name_ar: string;
};

export async function getItems(
  categoryId?: string,
): Promise<ItemWithCategory[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("items")
    .select("*, categories(name_en, name_ar)")
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

type ItemWithVariants = ItemRow & { variants: ItemVariantRow[] };

export async function getItem(id: string): Promise<ItemWithVariants> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("items")
    .select("*, item_variants(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Item not found");

  const item = data as Record<string, unknown> & {
    item_variants?: ItemVariantRow[];
  };

  return {
    ...item,
    variants: item.item_variants ?? [],
    item_variants: undefined,
  } as unknown as ItemWithVariants;
}

export async function createItem(
  data: ItemInput,
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  const parsed = itemSchema.safeParse(data);
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
  const parsed = itemUpdateSchema.safeParse(data);
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
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  const supabase = createAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from("items")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) return { success: false, error: fetchError.message };
  if (!current) return { success: false, error: "Item not found" };

  const { data: item, error } = await supabase
    .from("items")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: item };
}

export async function toggleBestseller(
  id: string,
): Promise<{ success: boolean; error?: string; data?: ItemRow }> {
  const supabase = createAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from("items")
    .select("is_bestseller")
    .eq("id", id)
    .single();

  if (fetchError) return { success: false, error: fetchError.message };
  if (!current) return { success: false, error: "Item not found" };

  const { data: item, error } = await supabase
    .from("items")
    .update({ is_bestseller: !current.is_bestseller })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: item };
}
