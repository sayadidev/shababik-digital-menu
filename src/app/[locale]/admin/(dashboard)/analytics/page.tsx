import { Suspense } from "react";
import { getFeedbackAnalytics } from "@/lib/actions/feedback-analytics";

type Props = {
  params: Promise<{ locale: string }>;
};

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function StarBar({
  stars,
  count,
  total,
  locale,
}: {
  stars: number;
  count: number;
  total: number;
  locale: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground w-16 shrink-0 rtl:text-right">
        {stars} {t(locale, "Stars", "نجوم")}
      </span>
      <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-muted w-8 shrink-0 rtl:text-left">
        {count}
      </span>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? "text-warning" : "text-border"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

async function StatsSection({ locale }: { locale: string }) {
  const data = await getFeedbackAnalytics().catch(() => null);
  if (!data) {
    return (
      <div className="bg-surface rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <p className="text-muted text-sm">
          {t(
            locale,
            "Failed to load analytics data.",
            "فشل تحميل بيانات الإحصائيات."
          )}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <div className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <p className="text-xs text-muted mb-1">
            {t(locale, "Total Reviews", "إجمالي التقييمات")}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {data.totalReviews}
          </p>
        </div>

        <div className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <p className="text-xs text-muted mb-1">
            {t(locale, "Average Rating", "متوسط التقييم")}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {data.averageRating}
            <span className="text-base text-muted font-normal">/5</span>
          </p>
          <StarRating rating={Math.round(data.averageRating)} />
        </div>

        <div className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <p className="text-xs text-muted mb-1">
            {t(locale, "5-Star Reviews", "تقييمات 5 نجوم")}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-success">
            {data.ratingDistribution.find((d) => d.stars === 5)?.count ?? 0}
          </p>
        </div>

        <div className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <p className="text-xs text-muted mb-1">
            {t(
              locale,
              "Satisfaction Rate",
              "نسبة الرضا"
            )}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-primary">
            {data.totalReviews > 0
              ? Math.round(
                  ((data.ratingDistribution
                    .filter((d) => d.stars >= 4)
                    .reduce((s, d) => s + d.count, 0) /
                    data.totalReviews) *
                    100)
                )
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {t(locale, "Rating Distribution", "توزيع التقييمات")}
        </h3>
        <div className="space-y-3">
          {data.ratingDistribution.map((d) => (
            <StarBar
              key={d.stars}
              stars={d.stars}
              count={d.count}
              total={data.totalReviews}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </>
  );
}

async function RecentComments({ locale }: { locale: string }) {
  const data = await getFeedbackAnalytics().catch(() => null);
  if (!data) return null;

  const comments = data.recentFeedback.filter((f) => f.feedback_text);

  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {t(locale, "Recent Comments", "أحدث التعليقات")}
      </h3>
      {comments.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">
          {t(locale, "No comments yet", "لا توجد تعليقات بعد")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="text-left rtl:text-right pb-2 font-medium">
                  {t(locale, "Rating", "التقييم")}
                </th>
                <th className="text-left rtl:text-right pb-2 font-medium">
                  {t(locale, "Feedback", "التعليق")}
                </th>
                <th className="text-right rtl:text-left pb-2 font-medium">
                  {t(locale, "Date", "التاريخ")}
                </th>
              </tr>
            </thead>
            <tbody>
              {comments.slice(0, 20).map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3">
                    <StarRating rating={c.rating} />
                  </td>
                  <td className="py-3 text-foreground max-w-xs md:max-w-md truncate">
                    {c.feedback_text}
                  </td>
                  <td className="py-3 text-muted text-right rtl:text-left whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString(
                      locale === "ar" ? "ar" : "en",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-4 md:space-y-5 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]"
          >
            <div className="h-3 w-20 bg-muted/30 rounded-full mb-3" />
            <div className="h-8 w-14 bg-muted/20 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <div className="h-3 w-28 bg-muted/30 rounded-full mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="h-4 w-12 bg-muted/30 rounded" />
            <div className="flex-1 h-2.5 bg-muted/20 rounded-full" />
            <div className="h-4 w-8 bg-muted/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)] animate-pulse">
      <div className="h-3 w-24 bg-muted/30 rounded-full mb-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex gap-3 py-3 border-b border-border/50 last:border-0"
        >
          <div className="h-4 w-20 bg-muted/30 rounded" />
          <div className="flex-1 h-4 bg-muted/20 rounded" />
          <div className="h-4 w-16 bg-muted/20 rounded" />
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <h2 className="text-lg font-bold text-foreground">
        {t(locale, "Customer Feedback Analytics", "تحليلات آراء الزبائن")}
      </h2>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection locale={locale} />
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <RecentComments locale={locale} />
      </Suspense>
    </div>
  );
}

