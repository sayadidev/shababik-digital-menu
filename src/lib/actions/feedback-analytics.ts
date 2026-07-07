"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";

export type FeedbackAnalytics = {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { stars: number; count: number }[];
  recentFeedback: {
    id: string;
    rating: number;
    feedback_text: string;
    created_at: string;
    table_number: number;
  }[];
};

export async function getFeedbackAnalytics(): Promise<FeedbackAnalytics> {
  await requireAuth();
  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, rating, feedback_text, created_at, table_number")
    .not("rating", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const allOrders = (orders ?? []) as {
    id: string;
    rating: number | null;
    feedback_text: string | null;
    created_at: string;
    table_number: number;
  }[];

  const totalReviews = allOrders.length;

  const averageRating =
    totalReviews > 0
      ? Math.round(
          (allOrders.reduce((sum, o) => sum + (o.rating ?? 0), 0) /
            totalReviews) *
            10
        ) / 10
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: allOrders.filter((o) => o.rating === stars).length,
  }));

  const recentFeedback = allOrders.slice(0, 50).map((o) => ({
    id: o.id,
    rating: o.rating!,
    feedback_text: o.feedback_text ?? "",
    created_at: o.created_at,
    table_number: o.table_number,
  }));

  return { totalReviews, averageRating, ratingDistribution, recentFeedback };
}
/*
export async function analyzeFeedback(
  reviews: string[]
): Promise<{ pros: string[]; cons: string[] }> {
  // AI analysis temporarily disabled — will be restored later
  return { pros: [], cons: [] };
}
*/
