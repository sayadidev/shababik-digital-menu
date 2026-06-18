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

const REFRESH_INTERVAL_MS = 30_000;

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
    } finally {
      setRefreshing(false);
    }
  }, []);

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
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">
          {t("lastUpdated")}{" "}
          <span className="font-medium text-base-content">
            {new Date().toLocaleTimeString()}
          </span>
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="btn btn-outline btn-sm"
        >
          {refreshing ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          {refreshing ? t("refreshing") : t("refresh")}
        </button>
      </div>

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

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-base-content">
          {t("trending")}
        </h3>

        {summary.trendingItems.length === 0 ? (
          <div className="card card-border border-dashed border-base-300 bg-base-200 p-8 text-center text-sm text-muted">
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
                  className="flex items-center gap-4 rounded-lg border border-border bg-base-100 px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-deep">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-base-content">
                      {item.name_en}
                    </p>
                    <p className="truncate text-xs text-muted" dir="rtl">
                      {item.name_ar}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-base-200 sm:block">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-base-content">
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
    <div className="stat rounded-xl border border-border bg-base-100 shadow-sm transition-shadow hover:shadow-md">
      <div className="stat-title">{label}</div>
      <div className="stat-value text-brand">{value}</div>
      <div className="stat-desc">{hint}</div>
    </div>
  );
}
