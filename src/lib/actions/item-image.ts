"use server";

import { revalidatePath } from "next/cache";
import { revalidateMenuPaths } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setItemImages(
  itemId: string,
  imageUrls: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Delete existing gallery images
  const { error: deleteError } = await supabase
    .from("item_images")
    .delete()
    .eq("item_id", itemId);

  if (deleteError) return { success: false, error: deleteError.message };

  // Insert new gallery images
  if (imageUrls.length > 0) {
    const { error: insertError } = await supabase.from("item_images").insert(
      imageUrls.map((url, i) => ({
        item_id: itemId,
        image_url: url,
        sort_order: i,
      })),
    );

    if (insertError) return { success: false, error: insertError.message };
  }

  revalidatePath("/admin");
  revalidateMenuPaths();
  return { success: true };
}
