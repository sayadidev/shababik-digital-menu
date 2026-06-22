import { Suspense } from "react";
import { getAnalyticsSummary } from "@/lib/actions/analytics";
import { getItems } from "@/lib/actions/item";
import DashboardMetrics from "@/components/admin/DashboardMetrics";
import SparklineChart from "@/components/admin/SparklineChart";
import TrendingItems from "@/components/admin/TrendingItems";
import QuickActions from "@/components/admin/QuickActions";
import RecentItems from "@/components/admin/RecentItems";

type Props = {
  params: Promise<{ locale: string }>;
};

const dayLabelsEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayLabelsAr = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];

async function MetricsSection({ locale }: { locale: string }) {
  const analytics = await getAnalyticsSummary().catch(() => ({
    menuViewsToday: 0, menuViewsThisWeek: 0, totalItems: 0, totalCategories: 0, trendingItems: [], dailyViews: [],
  }));
  const metrics = [
    { label: locale === "ar" ? "مشاهدات اليوم" : "Views Today", value: analytics.menuViewsToday, sub: locale === "ar" ? `من ${analytics.totalItems} أصناف نشطة` : `Across ${analytics.totalItems} active items`, subColor: "text-muted" as const },
    { label: locale === "ar" ? "هذا الأسبوع" : "This Week", value: analytics.menuViewsThisWeek, sub: locale === "ar" ? `${analytics.totalCategories} أقسام` : `${analytics.totalCategories} categories`, subColor: "text-muted" as const },
    { label: locale === "ar" ? "إجمالي الأصناف" : "Total Items", value: analytics.totalItems, sub: locale === "ar" ? `${analytics.totalCategories} أقسام` : `${analytics.totalCategories} categories` },
  ];
  return <DashboardMetrics metrics={metrics} />;
}

async function SparklineSection({ locale }: { locale: string }) {
  const analytics = await getAnalyticsSummary().catch(() => ({
    menuViewsToday: 0, menuViewsThisWeek: 0, totalItems: 0, totalCategories: 0, trendingItems: [], dailyViews: [],
  }));
  const dayLabels = locale === "ar" ? dayLabelsAr : dayLabelsEn;
  const sparklineData = analytics.dailyViews.length === 7
    ? analytics.dailyViews.map((d, i) => ({ label: dayLabels[i], value: d.count }))
    : dayLabels.map((label) => ({ label, value: 0 }));
  return <SparklineChart data={sparklineData} totalLabel={locale === "ar" ? "آخر 7 أيام" : "Last 7 days"} locale={locale} />;
}

async function TrendingSection({ locale }: { locale: string }) {
  const analytics = await getAnalyticsSummary().catch(() => ({
    menuViewsToday: 0, menuViewsThisWeek: 0, totalItems: 0, totalCategories: 0, trendingItems: [], dailyViews: [],
  }));
  return <TrendingItems items={analytics.trendingItems} locale={locale} />;
}

async function RecentSection({ locale }: { locale: string }) {
  const items = await getItems().catch(() => []);
  const recentItems = items.map((i) => ({ id: i.id, name_en: i.name_en, name_ar: i.name_ar, is_active: i.is_active }));
  return <RecentItems items={recentItems} locale={locale} />;
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <div className="h-3 w-20 bg-muted/30 rounded-full mb-3" />
          <div className="h-7 w-16 bg-muted/30 rounded-lg mb-2" />
          <div className="h-3 w-28 bg-muted/20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SparklineSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)] animate-pulse">
      <div className="h-3 w-36 bg-muted/30 rounded-full mb-4" />
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

function TrendingSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)] animate-pulse">
      <div className="h-3 w-24 bg-muted/30 rounded-full mb-4" />
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

function RecentSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)] animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-24 bg-muted/30 rounded-full" />
        <div className="h-3 w-16 bg-muted/20 rounded-full" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="min-w-[140px] bg-surface rounded-xl p-3 border border-border/50 space-y-2 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-muted/20 mx-auto" />
            <div className="h-3 w-20 bg-muted/30 rounded-full mx-auto" />
            <div className="h-2 w-12 bg-muted/20 rounded-full mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <Suspense fallback={<KpiSkeleton />}>
        <MetricsSection locale={locale} />
      </Suspense>
      <Suspense fallback={<SparklineSkeleton />}>
        <SparklineSection locale={locale} />
      </Suspense>
      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingSection locale={locale} />
        </Suspense>
        <QuickActions locale={locale} />
      </div>
      <Suspense fallback={<RecentSkeleton />}>
        <RecentSection locale={locale} />
      </Suspense>
    </div>
  );
}
