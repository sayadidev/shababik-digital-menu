import { getFeedbackAnalytics } from "@/lib/actions/feedback-analytics";
import { Link } from "@/i18n/navigation";

async function getFeedbackSummary() {
  const analytics = await getFeedbackAnalytics().catch(() => ({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [],
    recentFeedback: [],
  }));
  return {
    totalReviews: analytics.totalReviews,
    averageRating: analytics.averageRating,
    recentFeedback: analytics.recentFeedback.slice(0, 2),
  };
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: "#d4a017", letterSpacing: "0.05em" }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

export default async function QuickFeedbackSummary({ locale }: { locale: string }) {
  const { totalReviews, averageRating, recentFeedback } = await getFeedbackSummary();

  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {locale === "ar" ? "رضا الزبائن" : "Customer Satisfaction"}
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl font-bold text-foreground">
          {averageRating > 0 ? `⭐️ ${averageRating}/5` : `⭐️ —/5`}
        </div>
        <div className="text-xs text-muted">
          {locale === "ar"
            ? `(${totalReviews.toLocaleString("ar")} ${totalReviews === 1 ? "تقييم" : totalReviews === 2 ? "تقييمان" : totalReviews <= 10 ? "تقييمات" : "تقييماً"})`
            : `(${totalReviews.toLocaleString()} ${totalReviews === 1 ? "rating" : "ratings"})`}
        </div>
      </div>

      {recentFeedback.length > 0 ? (
        <div className="space-y-2 mb-4">
          {recentFeedback.map((fb) => (
            <div
              key={fb.id}
              className="p-2.5 rounded-xl text-xs"
              style={{ backgroundColor: "#f5efdf" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Stars rating={fb.rating} />
                <span className="text-muted" style={{ fontSize: "10px" }}>
                  {locale === "ar" ? `طاولة ${fb.table_number}` : `Table ${fb.table_number}`}
                </span>
              </div>
              <p className="text-foreground/80 leading-relaxed line-clamp-2">
                {fb.feedback_text || (locale === "ar" ? "بدون تعليق" : "No comment")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted text-center py-4">
          {locale === "ar" ? "لا توجد تقييمات بعد" : "No ratings yet"}
        </p>
      )}

      <Link
        href="/admin/analytics"
        locale={locale}
        className="text-xs text-primary font-medium hover:underline inline-block"
      >
        {locale === "ar" ? "عرض كل التحليلات ➔" : "View all analytics ➔"}
      </Link>
    </div>
  );
}
