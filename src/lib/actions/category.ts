"use server";

import { revalidatePath } from "next/cache";
import { revalidateMenuPaths } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  categorySchema,
  categoryUpdateSchema,
} from "@/lib/validations";
import type {
  CategoryInput,
  CategoryUpdate,
  CategoryRow,
} from "@/lib/validations";

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);

  return data;
}

export async function createCategory(
  data: CategoryInput,
): Promise<{ success: boolean; error?: string; data?: CategoryRow }> {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = createAdminClient();

  const { data: category, error } = await supabase
    .from("categories")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: category };
}

export async function updateCategory(
  id: string,
  data: CategoryUpdate,
): Promise<{ success: boolean; error?: string; data?: CategoryRow }> {
  const parsed = categoryUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = createAdminClient();

  const { data: category, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true, data: category };
}

export async function deleteCategory(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${count} item(s) still reference this category. Remove or reassign them first.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}

export async function reorderCategories(
  ids: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from("categories")
      .update({ order_index: i })
      .eq("id", ids[i]);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}
