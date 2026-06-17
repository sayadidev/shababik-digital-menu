"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AnalyticsEventType } from "@/types/database";

/**
 * Track a public analytics event (menu_load or item_tap).
 * Called from the customer-facing menu to record page views and item taps.
 * No auth required — RLS permits public inserts on analytics_events.
 */
export async function trackEvent(
  event_type: AnalyticsEventType,
  item_id?: string | null,
) {
  const admin = createAdminClient();

  const { error } = await admin.from("analytics_events").insert({
    event_type,
    item_id: item_id ?? null,
  });

  // If it's an item_tap, also increment the item's view_count
  // Note: slight race condition possible, acceptable for view counts
  if (!error && event_type === "item_tap" && item_id) {
    const { data: current } = await admin
      .from("items")
      .select("view_count")
      .eq("id", item_id)
      .single();

    await admin
      .from("items")
      .update({ view_count: (current?.view_count ?? 0) + 1 })
      .eq("id", item_id);
  }

  if (error) {
    console.error("trackEvent error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export type TrendingItem = {
  id: string;
  name_en: string;
  name_ar: string;
  view_count: number;
};

export type AnalyticsSummary = {
  menuViewsToday: number;
  menuViewsThisWeek: number;
  totalItems: number;
  trendingItems: TrendingItem[];
};

/**
 * Get analytics summary for the admin dashboard.
 * Uses service-role client to bypass RLS.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const admin = createAdminClient();

  // Date boundaries
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const todayStr = todayStart.toISOString();
  const weekStr = weekStart.toISOString();

  // Query today's menu_load events
  const { count: todayCount, error: todayErr } = await admin
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "menu_load")
    .gte("timestamp", todayStr);

  if (todayErr) console.error("todayErr:", todayErr);

  // Query this week's menu_load events
  const { count: weekCount, error: weekErr } = await admin
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "menu_load")
    .gte("timestamp", weekStr);

  if (weekErr) console.error("weekErr:", weekErr);

  // Query trending items (top 5 by view_count)
  const { data: trendingData, error: trendingErr } = await admin
    .from("items")
    .select("id, name_en, name_ar, view_count")
    .order("view_count", { ascending: false })
    .limit(5);

  if (trendingErr) console.error("trendingErr:", trendingErr);

  // Total active items
  const { count: totalCount, error: totalErr } = await admin
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (totalErr) console.error("totalErr:", totalErr);

  return {
    menuViewsToday: todayCount ?? 0,
    menuViewsThisWeek: weekCount ?? 0,
    totalItems: totalCount ?? 0,
    trendingItems: (trendingData ?? []) as TrendingItem[],
  };
}
