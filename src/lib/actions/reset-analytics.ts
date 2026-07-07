"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";
import { revalidateMenuPaths } from "@/lib/revalidate";

export async function resetAnalytics(): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error: orderItemsErr } = await admin
    .from("order_items")
    .delete()
    .not("id", "is", null);

  if (orderItemsErr) return { success: false, error: orderItemsErr.message };

  const { error: ordersErr } = await admin
    .from("orders")
    .delete()
    .not("id", "is", null);

  if (ordersErr) return { success: false, error: ordersErr.message };

  const { error: delError } = await admin
    .from("analytics_events")
    .delete()
    .not("id", "is", null);

  if (delError) return { success: false, error: delError.message };

  const { error: resetError } = await admin
    .from("items")
    .update({ view_count: 0 })
    .not("id", "is", null);

  if (resetError) return { success: false, error: resetError.message };

  revalidateMenuPaths();
  return { success: true };
}
