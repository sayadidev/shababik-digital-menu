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

export type DailyView = {
  date: string;
  count: number;
};

export type AnalyticsSummary = {
  menuViewsToday: number;
  menuViewsThisWeek: number;
  totalItems: number;
  totalCategories: number;
  trendingItems: TrendingItem[];
  dailyViews: DailyView[];
};

/**
 * Get analytics summary for the admin dashboard.
 * Uses service-role client to bypass RLS.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const admin = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const todayStr = todayStart.toISOString();
  const weekStr = weekStart.toISOString();

  const [todayRes, weekRes, trendingRes, totalItemsRes, categoriesRes, dailyRes] =
    await Promise.all([
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "menu_load")
        .gte("timestamp", todayStr),
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "menu_load")
        .gte("timestamp", weekStr),
      admin
        .from("items")
        .select("id, name_en, name_ar, view_count")
        .order("view_count", { ascending: false })
        .limit(5),
      admin
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      admin
        .from("categories")
        .select("id", { count: "exact", head: true }),
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const dayStart = new Date(todayStart);
          dayStart.setDate(dayStart.getDate() - (6 - i));
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          return admin
            .from("analytics_events")
            .select("id", { count: "exact", head: true })
            .eq("event_type", "menu_load")
            .gte("timestamp", dayStart.toISOString())
            .lt("timestamp", dayEnd.toISOString())
            .then((res) => ({
              date: dayStart.toISOString().slice(0, 10),
              count: res.count ?? 0,
            }));
        }),
      ),
    ]);

  return {
    menuViewsToday: todayRes.count ?? 0,
    menuViewsThisWeek: weekRes.count ?? 0,
    totalItems: totalItemsRes.count ?? 0,
    totalCategories: categoriesRes.count ?? 0,
    trendingItems: (trendingRes.data ?? []) as TrendingItem[],
    dailyViews: dailyRes,
  };
}
