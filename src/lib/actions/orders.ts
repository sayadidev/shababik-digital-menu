"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface OrderItemRow {
  id: string;
  order_id: string;
  item_name: string;
  variant_name?: string | null;
  quantity: number;
  notes?: string | null;
}

export interface OrderRow {
  id: string;
  table_number: number;
  status: OrderStatus;
  total_usd: number;
  total_syp: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  accepted_by: string | null;
  completed_by: string | null;
  rating: number | null;
  feedback_text: string | null;
  order_items: OrderItemRow[];
}

// ── Fetch orders by status ──

export async function getOrdersByStatus(status: OrderStatus): Promise<OrderRow[]> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getOrdersByStatus error:", error.message);
    return [];
  }
  return (data as OrderRow[]) ?? [];
}

// ── Fetch orders by date (for history tab) ──

export async function getOrdersByDate(dateStr: string): Promise<{
  completed: OrderRow[];
  cancelled: OrderRow[];
}> {
  await requireAuth();
  const supabase = createAdminClient();

  const start = `${dateStr}T00:00:00Z`;
  const end = `${dateStr}T23:59:59Z`;

  const { data: completed, error: cErr } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("status", "completed")
    .gte("completed_at", start)
    .lte("completed_at", end)
    .order("completed_at", { ascending: false });

  if (cErr) console.error("getOrdersByDate completed error:", cErr.message);

  const { data: cancelled, error: xErr } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("status", "cancelled")
    .gte("updated_at", start)
    .lte("updated_at", end)
    .order("updated_at", { ascending: false });

  if (xErr) console.error("getOrdersByDate cancelled error:", xErr.message);

  return {
    completed: (completed as OrderRow[]) ?? [],
    cancelled: (cancelled as OrderRow[]) ?? [],
  };
}

// ── Fetch all active orders (pending + processing) ──

export async function getActiveOrders(): Promise<OrderRow[]> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getActiveOrders error:", error.message);
    return [];
  }
  return (data as OrderRow[]) ?? [];
}

// ── Create order (from customer cart) ──

const COOLDOWN_MS = 15 * 60 * 1000;

export async function createOrder(input: {
  table_number?: number;
  items: { name: string; quantity: number; notes?: string; variant?: string }[];
  total_usd: number;
  total_syp: number;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const supabase = createAdminClient();

  // ── Validate table_number ──
  if (input.table_number != null && input.table_number < 1) {
    return { success: false, error: "Invalid table number" };
  }

  // ── Validate items ──
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Order must contain at least one item" };
  }

  for (const item of input.items) {
    if (!item.name || item.name.trim().length === 0) {
      return { success: false, error: "Item name is required" };
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { success: false, error: `Invalid quantity for "${item.name}"` };
    }
    if (item.notes && item.notes.length > 1000) {
      return { success: false, error: "Notes too long" };
    }
  }

  // ── Server-side price verification ──
  // Fetch the current prices from the database for every (item, variant) pair
  // and recompute the expected total. Reject if the client total does not match.
  let computedUsd = 0;
  let computedSyp = 0;

  for (const item of input.items) {
    // Look up the item by name + variant to get the real price
    let query = supabase
      .from("item_variants")
      .select("price_usd, price_syp, size_name_en, size_name_ar, items!inner(name_en, name_ar, category_id)")
      .eq("items.name_en", item.name)
      .eq("items.is_active", true);

    // If a variant is specified, filter by it (check both en and ar names)
    if (item.variant) {
      query = query.or(`size_name_en.eq."${item.variant.replace(/"/g, '""')}",size_name_ar.eq."${item.variant.replace(/"/g, '""')}"`);
    }

    const { data: variants } = await query;

    if (!variants || variants.length === 0) {
      // Fallback: try matching by Arabic name
      let fallbackQuery = supabase
        .from("item_variants")
        .select("price_usd, price_syp, size_name_en, size_name_ar, items!inner(name_en, name_ar, category_id)")
        .eq("items.name_ar", item.name)
        .eq("items.is_active", true);

      if (item.variant) {
        fallbackQuery = fallbackQuery.or(`size_name_en.eq."${item.variant.replace(/"/g, '""')}",size_name_ar.eq."${item.variant.replace(/"/g, '""')}"`);
      }

      const { data: fallback } = await fallbackQuery;
      if (!fallback || fallback.length === 0) {
        return { success: false, error: `Item "${item.name}" not found in menu` };
      }

      const v = item.variant
        ? fallback.find(
          (r: { size_name_en: string; size_name_ar: string }) =>
            r.size_name_en === item.variant || r.size_name_ar === item.variant,
        )
        : fallback[0];

      if (!v) {
        return { success: false, error: `Variant "${item.variant}" not found for "${item.name}"` };
      }

      computedUsd += v.price_usd * item.quantity;
      computedSyp += v.price_syp * item.quantity;
    } else {
      const v = item.variant
        ? variants.find(
          (r: { size_name_en: string; size_name_ar: string }) =>
            r.size_name_en === item.variant || r.size_name_ar === item.variant,
        )
        : variants[0];

      if (!v) {
        return { success: false, error: `Variant "${item.variant}" not found for "${item.name}"` };
      }

      computedUsd += v.price_usd * item.quantity;
      computedSyp += v.price_syp * item.quantity;
    }
  }

  // Round computed values to 2 decimal places for comparison
  computedUsd = Math.round(computedUsd * 100) / 100;

  if (Math.abs(input.total_usd - computedUsd) > 0.01) {
    return { success: false, error: "Price mismatch — order total does not match menu prices" };
  }
  if (input.total_syp !== undefined && input.total_syp !== computedSyp) {
    return { success: false, error: "Price mismatch — order total does not match menu prices" };
  }

  // ── Server-side cooldown check (IP-based) ──
  // This is a best-effort check using the last order from the same table.
  // For anonymous users, we use table_number as a proxy.
  const tableNum = input.table_number ?? 1;
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("created_at")
    .eq("table_number", tableNum)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentOrders && recentOrders.length > 0) {
    const lastOrderTime = new Date(recentOrders[0].created_at).getTime();
    if (Date.now() - lastOrderTime < COOLDOWN_MS) {
      return { success: false, error: "Please wait before placing another order from this table" };
    }
  }

  // ── Insert order ──
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      table_number: tableNum,
      status: "pending",
      total_usd: computedUsd,
      total_syp: computedSyp,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { success: false, error: orderErr?.message ?? "Failed to create order" };
  }

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    item_name: item.name,
    variant_name: item.variant || null,
    quantity: item.quantity,
    notes: item.notes || null,
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsErr) {
    return { success: false, error: itemsErr.message };
  }

  revalidatePath("/admin/orders");
  return { success: true, orderId: order.id };
}

// ── Update order status (accept / reject / ready) ──

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userEmail?: string | null,
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  if (!orderId || typeof orderId !== "string") {
    return { success: false, error: "Invalid order ID" };
  }

  const validStatuses: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  const supabase = createAdminClient();

  const identifier = userEmail ?? "Unknown User";

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "processing") {
    updateData.accepted_by = identifier;
  }

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
    updateData.completed_by = identifier;
  }

  try {
    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      console.error("updateOrderStatus DB error:", error.message, error.code);
      return { success: false, error: error.message };
    }
  } catch (err) {
    console.error("Failed to update order status:", err);
    return { success: false, error: "Failed to update order status" };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function submitOrderFeedback(
  orderId: string,
  rating: number,
  text?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  if (!orderId || typeof orderId !== "string") {
    return { success: false, error: "Invalid order ID" };
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return { success: false, error: "Rating must be an integer between 1 and 5" };
  }

  if (text && text.length > 2000) {
    return { success: false, error: "Feedback too long" };
  }

  // Only allow feedback on completed orders
  const { data: existing } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!existing) {
    return { success: false, error: "Order not found" };
  }

  if (existing.status !== "completed") {
    return { success: false, error: "Can only rate completed orders" };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      rating,
      feedback_text: text?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("submitOrderFeedback error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}
