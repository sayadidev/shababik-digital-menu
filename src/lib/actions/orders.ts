"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, isStaff, isSuperAdmin } from "@/lib/auth";
import { requirePro } from "@/lib/actions/settings-public";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface OrderItemRow {
  id: string;
  order_id: string;
  item_name: string;
  item_name_en?: string | null;
  variant_name?: string | null;
  quantity: number;
  notes?: string | null;
  is_added_later?: boolean | null;
  price_usd?: number | null;
  price_syp?: number | null;
  price_try?: number | null;
}

export interface OrderRow {
  id: string;
  table_number: string;
  secure_token: string | null;
  customer_name: string | null;
  session_id: string | null;
  status: OrderStatus;
  total_usd: number;
  total_syp: number;
  total_try: number;
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
// No auth required — customers are anonymous.

const COOLDOWN_MS = 15 * 60 * 1000;

export async function createOrder(input: {
  secure_token?: string | null;
  table_number?: string;
  customer_name?: string | null;
  session_id?: string | null;
  items: { name: string; nameEn?: string; quantity: number; notes?: string; variant?: string }[];
  total_usd: number;
  total_syp: number;
  total_try: number;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    await requirePro();

    const supabase = createAdminClient();

    // ── Validate table via secure_token ──
    let resolvedTableNumber: string | null = null;

    if (input.secure_token) {
      const { data: tableRow } = await supabase
        .from("tables")
        .select("table_number")
        .eq("secure_token", input.secure_token)
        .maybeSingle();

      if (!tableRow) {
        throw new Error("يرجى مسح رمز الـ QR الموجود على طاولتك لإتمام الطلب.");
      }

      resolvedTableNumber = tableRow.table_number;
    }

    // ── Fallback to explicit table_number (staff override / backwards compat) ──
    const tableNum = input.table_number ?? resolvedTableNumber ?? "1";

    // ── Validate table_number ──
    if (input.table_number != null && input.table_number.trim().length === 0) {
      throw new Error("Invalid table number");
    }

    // ── Validate items ──
    if (!input.items || input.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    for (const item of input.items) {
      if (!item.name || item.name.trim().length === 0) {
        throw new Error("Item name is required");
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error(`Invalid quantity for "${item.name}"`);
      }
      if (item.notes && item.notes.length > 1000) {
        throw new Error("Notes too long");
      }
    }

    // ── Determine active currency from settings ──
    const { data: settings } = await supabase
      .from("site_settings")
      .select("active_currency")
      .eq("id", 1)
      .single();

    const activeCurrency = (settings?.active_currency as string) ?? "TRY";

    // ── Server-side price verification ──
    let computedUsd = 0;
    let computedSyp = 0;
    let computedTry = 0;
    const itemPrices: { price_usd: number; price_syp: number; price_try: number }[] = [];

    for (const item of input.items) {
      let query = supabase
        .from("item_variants")
        .select("price_usd, price_syp, price_try, size_name_en, size_name_ar, items!inner(name_en, name_ar, category_id)")
        .eq("items.name_en", item.name)
        .eq("items.is_active", true);

      if (item.variant) {
        query = query.or(`size_name_en.eq."${item.variant.replace(/"/g, '""')}",size_name_ar.eq."${item.variant.replace(/"/g, '""')}"`);
      }

      const { data: variants } = await query;

      let matchedVariant: {
        price_usd: number | null;
        price_syp: number | null;
        price_try: number | null;
      } | null = null;

      if (!variants || variants.length === 0) {
        let fallbackQuery = supabase
          .from("item_variants")
          .select("price_usd, price_syp, price_try, size_name_en, size_name_ar, items!inner(name_en, name_ar, category_id)")
          .eq("items.name_ar", item.name)
          .eq("items.is_active", true);

        if (item.variant) {
          fallbackQuery = fallbackQuery.or(`size_name_en.eq."${item.variant.replace(/"/g, '""')}",size_name_ar.eq."${item.variant.replace(/"/g, '""')}"`);
        }

        const { data: fallback } = await fallbackQuery;
        if (!fallback || fallback.length === 0) {
          throw new Error(`Item "${item.name}" not found in menu`);
        }

        const v = item.variant
          ? fallback.find(
            (r: { size_name_en: string; size_name_ar: string }) =>
              r.size_name_en === item.variant || r.size_name_ar === item.variant,
          )
          : fallback[0];

        if (!v) {
          throw new Error(`Variant "${item.variant}" not found for "${item.name}"`);
        }

        matchedVariant = v;
      } else {
        const v = item.variant
          ? variants.find(
            (r: { size_name_en: string; size_name_ar: string }) =>
              r.size_name_en === item.variant || r.size_name_ar === item.variant,
          )
          : variants[0];

        if (!v) {
          throw new Error(`Variant "${item.variant}" not found for "${item.name}"`);
        }

        matchedVariant = v;
      }

      computedUsd += (matchedVariant.price_usd ?? 0) * item.quantity;
      computedSyp += (matchedVariant.price_syp ?? 0) * item.quantity;
      computedTry += (matchedVariant.price_try ?? 0) * item.quantity;

      itemPrices.push({
        price_usd: matchedVariant.price_usd ?? 0,
        price_syp: matchedVariant.price_syp ?? 0,
        price_try: matchedVariant.price_try ?? 0,
      });
    }

    computedUsd = Math.round(computedUsd * 100) / 100;

    // ── Verify totals against client-submitted values ──
    // Only verify the active currency total; others are best-effort.
    if (activeCurrency === "TRY") {
      if (Math.abs(input.total_try - computedTry) > 0.01) {
        throw new Error("Price mismatch — order total does not match menu prices");
      }
    } else {
      // SYP
      if (input.total_syp !== computedSyp) {
        throw new Error("Price mismatch — order total does not match menu prices");
      }
    }

    // ── Server-side cooldown check (per-session-id) ──
    // Bypass for authenticated staff/admin
    let isAdmin = false;
    try {
      const cookieStore = await cookies();
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        },
      );
      const { data: { session } } = await authClient.auth.getSession();
      if (session) {
        isAdmin = isStaff(session) || isSuperAdmin(session);
      }
    } catch {
      // Not authenticated — proceed with cooldown
    }

    if (!isAdmin && input.session_id) {
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("created_at")
        .eq("session_id", input.session_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentOrders && recentOrders.length > 0) {
        const lastOrderTime = new Date(recentOrders[0].created_at).getTime();
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastOrderTime)) / 60000);
        if (remaining > 0) {
          throw new Error(
            `عذراً، يرجى الانتظار ${remaining} دقيقة قبل إرسال طلب جديد، أو تفضل بمناداة أحد الموظفين لخدمتك فوراً.`
          );
        }
      }
    }

    // ── Insert order ──
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        table_number: tableNum,
        secure_token: input.secure_token ?? null,
        customer_name: input.customer_name?.trim() || null,
        session_id: input.session_id || null,
        status: "pending",
        total_usd: computedUsd,
        total_syp: computedSyp,
        total_try: computedTry,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr?.message ?? "Failed to create order");
    }

    const orderItems = input.items.map((item, idx) => ({
      order_id: order.id,
      item_name: item.name,
      item_name_en: item.nameEn || null,
      variant_name: item.variant || null,
      quantity: item.quantity,
      notes: item.notes || null,
      price_usd: itemPrices[idx]?.price_usd ?? 0,
      price_syp: itemPrices[idx]?.price_syp ?? 0,
      price_try: itemPrices[idx]?.price_try ?? 0,
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsErr) {
      throw new Error(itemsErr.message);
    }

    revalidatePath("/admin/orders");
    return { success: true, orderId: order.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("CREATE_ORDER_ERROR:", message);
    return { success: false, error: message };
  }
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

export async function updateOrderTable(
  orderId: string,
  newSecureToken: string,
  newTableNumber: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  if (!orderId || typeof orderId !== "string") {
    return { success: false, error: "Invalid order ID" };
  }

  const supabase = createAdminClient();

  const { data: tableRow, error: tableErr } = await supabase
    .from("tables")
    .select("table_number, secure_token")
    .eq("secure_token", newSecureToken)
    .maybeSingle();

  if (tableErr || !tableRow) {
    return { success: false, error: "Table not found" };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      table_number: tableRow.table_number,
      secure_token: tableRow.secure_token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("updateOrderTable error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function addItemsToOrder(
  orderId: string,
  newItems: { name: string; nameEn?: string; quantity: number; notes?: string; variant?: string }[],
  additionalUsd: number,
  additionalSyp: number,
  additionalTry: number,
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  if (!orderId || typeof orderId !== "string") {
    return { success: false, error: "Invalid order ID" };
  }

  if (!newItems || newItems.length === 0) {
    return { success: false, error: "No items to add" };
  }

  const supabase = createAdminClient();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, status, total_usd, total_syp, total_try")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status !== "pending" && order.status !== "processing") {
    return { success: false, error: "Can only modify active orders" };
  }

  let computedUsd = 0;
  let computedSyp = 0;
  let computedTry = 0;
  const itemPrices: { price_usd: number; price_syp: number; price_try: number }[] = [];

  for (const item of newItems) {
    if (!item.name || item.name.trim().length === 0) {
      return { success: false, error: "Item name is required" };
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { success: false, error: `Invalid quantity for "${item.name}"` };
    }

    let query = supabase
      .from("item_variants")
      .select("price_usd, price_syp, price_try, size_name_en, size_name_ar, items!inner(name_en, name_ar)")
      .eq("items.name_en", item.name)
      .eq("items.is_active", true);

    if (item.variant) {
      query = query.or(`size_name_en.eq."${item.variant.replace(/"/g, '""')}",size_name_ar.eq."${item.variant.replace(/"/g, '""')}"`);
    }

    const { data: variants } = await query;

    if (!variants || variants.length === 0) {
      let fallbackQuery = supabase
        .from("item_variants")
        .select("price_usd, price_syp, price_try, size_name_en, size_name_ar, items!inner(name_en, name_ar)")
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
          (r: any) =>
            r.size_name_en === item.variant || r.size_name_ar === item.variant,
        )
        : fallback[0];

      if (!v) {
        return { success: false, error: `Variant "${item.variant}" not found for "${item.name}"` };
      }

      computedUsd += (v.price_usd ?? 0) * item.quantity;
      computedSyp += (v.price_syp ?? 0) * item.quantity;
      computedTry += (v.price_try ?? 0) * item.quantity;

      itemPrices.push({
        price_usd: v.price_usd ?? 0,
        price_syp: v.price_syp ?? 0,
        price_try: v.price_try ?? 0,
      });
    } else {
      const v = item.variant
        ? variants.find(
          (r: any) =>
            r.size_name_en === item.variant || r.size_name_ar === item.variant,
        )
        : variants[0];

      if (!v) {
        return { success: false, error: `Variant "${item.variant}" not found for "${item.name}"` };
      }

      computedUsd += (v.price_usd ?? 0) * item.quantity;
      computedSyp += (v.price_syp ?? 0) * item.quantity;
      computedTry += (v.price_try ?? 0) * item.quantity;

      itemPrices.push({
        price_usd: v.price_usd ?? 0,
        price_syp: v.price_syp ?? 0,
        price_try: v.price_try ?? 0,
      });
    }
  }

  computedUsd = Math.round(computedUsd * 100) / 100;

  const orderItems = newItems.map((item, idx) => ({
    order_id: orderId,
    item_name: item.name,
    item_name_en: item.nameEn || null,
    variant_name: item.variant || null,
    quantity: item.quantity,
    notes: item.notes || null,
    is_added_later: true,
    price_usd: itemPrices[idx]?.price_usd ?? 0,
    price_syp: itemPrices[idx]?.price_syp ?? 0,
    price_try: itemPrices[idx]?.price_try ?? 0,
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsErr) {
    return { success: false, error: itemsErr.message };
  }

  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      total_usd: (order.total_usd ?? 0) + computedUsd,
      total_syp: (order.total_syp ?? 0) + computedSyp,
      total_try: (order.total_try ?? 0) + computedTry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateErr) {
    console.error("addItemsToOrder update error:", updateErr.message);
    return { success: false, error: updateErr.message };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

export interface GroupedSession {
  sessionId: string;
  customerName: string;
  tableNumber: string;
  orders: OrderRow[];
  grandTotalUsd: number;
  grandTotalSyp: number;
  grandTotalTry: number;
}

export async function searchAndGroupOrders(
  query: string,
): Promise<{ grouped: GroupedSession[]; totalOrders: number }> {
  await requireAuth();

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const start = `${today}T00:00:00Z`;
  const end = `${today}T23:59:59Z`;

  let builder = supabase
    .from("orders")
    .select("*, order_items(*)")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });

  const trimmed = query.trim();
  if (trimmed) {
    const isTableSearch = /^\d+$/.test(trimmed);

    if (isTableSearch) {
      builder = builder.eq("table_number", trimmed);
    } else {
      builder = builder.or(`customer_name.ilike.%${trimmed}%,table_number.ilike.%${trimmed}%`);
    }
  } else {
    builder = builder.limit(50);
  }

  const { data, error } = await builder;

  if (error || !data) {
    console.error("searchAndGroupOrders error:", error?.message);
    return { grouped: [], totalOrders: 0 };
  }

  const rows = data as OrderRow[];

  const sessionMap = new Map<string, GroupedSession>();
  const noSessionOrders: GroupedSession[] = [];

  for (const row of rows) {
    const key = row.session_id || `__nosession__${row.id}`;

    if (!row.session_id) {
      noSessionOrders.push({
        sessionId: row.id,
        customerName: row.customer_name ?? "",
        tableNumber: row.table_number,
        orders: [row],
        grandTotalUsd: row.total_usd,
        grandTotalSyp: row.total_syp,
        grandTotalTry: row.total_try ?? 0,
      });
      continue;
    }

    if (sessionMap.has(key)) {
      const g = sessionMap.get(key)!;
      g.orders.push(row);
      g.grandTotalUsd += row.total_usd;
      g.grandTotalSyp += row.total_syp;
      g.grandTotalTry += row.total_try ?? 0;
    } else {
      sessionMap.set(key, {
        sessionId: key,
        customerName: row.customer_name ?? "",
        tableNumber: row.table_number,
        orders: [row],
        grandTotalUsd: row.total_usd,
        grandTotalSyp: row.total_syp,
        grandTotalTry: row.total_try ?? 0,
      });
    }
  }

  const grouped = [...sessionMap.values(), ...noSessionOrders]
    .sort((a, b) => {
      const aTime = new Date(a.orders[0].created_at).getTime();
      const bTime = new Date(b.orders[0].created_at).getTime();
      return bTime - aTime;
    });

  const grandTotalUsd = Math.round(
    grouped.reduce((s, g) => s + g.grandTotalUsd, 0) * 100,
  ) / 100;

  return { grouped, totalOrders: rows.length };
}
