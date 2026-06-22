import { Suspense } from "react";
import { getAnalyticsSummary } from "@/lib/actions/analytics";

type Props = {
  params: Promise<{ locale: string }>;
};

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

async function StatCards({ locale }: { locale: string }) {
  const analytics = await getAnalyticsSummary().catch(() => null);
  if (!analytics) {
    return (
      <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <p className="text-muted text-sm">{t(locale, "Failed to load analytics data.", "فشل تحميل بيانات الإحصائيات.")}</p>
      </div>
    );
  }
  const totalViewsThisWeek = analytics.menuViewsThisWeek;
  const avgDaily = analytics.dailyViews.length > 0
    ? Math.round(analytics.dailyViews.reduce((s, d) => s + d.count, 0) / analytics.dailyViews.length)
    : 0;
  const topItem = analytics.trendingItems[0]?.name_en ?? t(locale, "N/A", "غير متوفر");
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
      {[
        { label: t(locale, "Total Views (7d)", "إجمالي المشاهدات (7 أيام)"), value: totalViewsThisWeek.toLocaleString() },
        { label: t(locale, "Avg. Daily Views", "متوسط المشاهدات اليومية"), value: avgDaily.toLocaleString() },
        { label: t(locale, "Top Item", "الأكثر طلباً"), value: topItem },
        { label: t(locale, "Active Items", "الأصناف النشطة"), value: analytics.totalItems.toString() },
      ].map((stat) => (
        <div key={stat.label} className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <p className="text-xs text-muted mb-1">{stat.label}</p>
          <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

async function DailyViewsChart({ locale }: { locale: string }) {
  const analytics = await getAnalyticsSummary().catch(() => null);
  if (!analytics) return null;
  const maxDaily = Math.max(...analytics.dailyViews.map((d) => d.count), 1);
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
      <h3 className="text-sm font-semibold text-foreground mb-4">{t(locale, "Daily Views", "المشاهدات اليومية")}</h3>
      {analytics.dailyViews.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">{t(locale, "No data yet", "لا توجد بيانات بعد")}</p>
      ) : (
        <div className="flex items-end gap-2 h-32">
          {analytics.dailyViews.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm bg-primary/60 hover:bg-primary transition-all"
                style={{ height: `${(d.count / maxDaily) * 100}%` }}
                title={`${d.date}: ${d.count} ${t(locale, "views", "مشاهدة")}`} />
              <span className="text-[10px] text-muted">
                {new Date(d.date).toLocaleDateString(locale === "ar" ? "ar" : "en", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function TopItemsList({ locale }: { locale: string }) {
  const analytics = await getAnalyticsSummary().catch(() => null);
  if (!analytics) return null;
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
      <h3 className="text-sm font-semibold text-foreground mb-4">{t(locale, "Top Items by Views", "الأصناف الأكثر مشاهدة")}</h3>
      {analytics.trendingItems.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">{t(locale, "No view data yet", "لا توجد بيانات مشاهدة بعد")}</p>
      ) : (
        <div className="space-y-3">
          {analytics.trendingItems.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${i === 0 ? "bg-primary text-white" : "bg-primary/20 text-primary"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name_en}</p>
                <p className="text-xs text-muted">{item.view_count.toLocaleString()} {t(locale, "views", "مشاهدة")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function WeeklyOverview({ locale }: { locale: string }) {
  const analytics = await getAnalyticsSummary().catch(() => null);
  if (!analytics) return null;
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
      <h3 className="text-sm font-semibold text-foreground mb-3">{t(locale, "Weekly Overview", "نظرة أسبوعية")}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t(locale, "Today", "اليوم"), value: analytics.menuViewsToday.toLocaleString() },
          { label: t(locale, "This Week", "هذا الأسبوع"), value: analytics.menuViewsThisWeek.toLocaleString() },
          { label: t(locale, "Categories", "الأقسام"), value: analytics.totalCategories.toString() },
          { label: t(locale, "Items", "الأصناف"), value: analytics.totalItems.toString() },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-background/50">
            <p className="text-xs text-muted mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <div className="h-3 w-20 bg-muted/30 rounded-full mb-2" />
          <div className="h-7 w-12 bg-muted/20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)] animate-pulse">
      <div className="h-3 w-24 bg-muted/30 rounded-full mb-4" />
      <div className="flex items-end gap-2 h-32">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-muted/20 rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
            <div className="h-2 w-6 bg-muted/20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopItemsSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)] animate-pulse">
      <div className="h-3 w-28 bg-muted/30 rounded-full mb-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded-full bg-muted/20 shrink-0" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-muted/30 rounded-full mb-1" />
            <div className="h-2 w-16 bg-muted/20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WeeklyOverviewSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)] animate-pulse">
      <div className="h-3 w-28 bg-muted/30 rounded-full mb-3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-background/50 space-y-2">
            <div className="h-3 w-16 bg-muted/20 rounded-full" />
            <div className="h-5 w-12 bg-muted/20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <h2 className="text-lg font-bold text-foreground">{t(locale, "Analytics", "الإحصائيات")}</h2>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards locale={locale} />
      </Suspense>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <Suspense fallback={<ChartSkeleton />}>
          <DailyViewsChart locale={locale} />
        </Suspense>
        <Suspense fallback={<TopItemsSkeleton />}>
          <TopItemsList locale={locale} />
        </Suspense>
      </div>

      <Suspense fallback={<WeeklyOverviewSkeleton />}>
        <WeeklyOverview locale={locale} />
      </Suspense>
    </div>
  );
}
