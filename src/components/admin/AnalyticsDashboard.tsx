"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  getAnalyticsSummary,
  type AnalyticsSummary,
} from "@/lib/actions/analytics";

type Props = {
  initialSummary: AnalyticsSummary;
};

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export default function AnalyticsDashboard({ initialSummary }: Props) {
  const t = useTranslations("admin");
  const [summary, setSummary] = useState(initialSummary);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await getAnalyticsSummary();
      setSummary(fresh);
    } catch {
      // Silently fail — stale data is acceptable
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh on an interval
  useEffect(() => {
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const maxViewCount = Math.max(
    ...summary.trendingItems.map((i) => i.view_count),
    1,
  );

  return (
    <div>
      {/* Header with refresh button */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {t("lastUpdated")}{" "}
          <span className="font-medium text-gray-700">
            {new Date().toLocaleTimeString()}
          </span>
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <svg
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? t("refreshing") : t("refresh")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("menuViewsToday")}
          value={summary.menuViewsToday}
          hint={t("today")}
        />
        <StatCard
          label={t("menuViewsThisWeek")}
          value={summary.menuViewsThisWeek}
          hint={t("thisWeek")}
        />
        <StatCard
          label={t("totalItems")}
          value={summary.totalItems}
          hint={t("activeItems")}
        />
      </div>

      {/* Trending Items */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t("trending")}
        </h3>

        {summary.trendingItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
            {t("noTrendingData")}
          </div>
        ) : (
          <div className="space-y-3">
            {summary.trendingItems.map((item, index) => {
              const barWidth =
                maxViewCount > 0
                  ? Math.max(4, (item.view_count / maxViewCount) * 100)
                  : 4;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  {/* Rank */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                    {index + 1}
                  </span>

                  {/* Bilingual name */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.name_en}
                    </p>
                    <p className="truncate text-xs text-gray-500" dir="rtl">
                      {item.name_ar}
                    </p>
                  </div>

                  {/* Visual bar + count */}
                  <div className="flex items-center gap-3">
                    <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-gray-100 sm:block">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-gray-700">
                      {item.view_count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  );
}
