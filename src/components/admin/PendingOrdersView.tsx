"use client";

import { formatCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

interface PendingItem {
  name: string;
  variant?: string;
  quantity: number;
  notes?: string;
  isAddedLater?: boolean;
  priceSyp?: number;
  priceUsd?: number;
  priceTry?: number;
}

interface PendingOrder {
  id: string;
  dailyOrderNumber: number | null;
  tableNumber: string;
  customerName: string | null;
  items: PendingItem[];
  totalUsd: number;
  totalSyp: number;
  totalTry: number;
  createdAt: string;
  status: string;
}

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function isToday(iso: string): boolean {
  try {
    const d = new Date(iso);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

function PendingOrderCard({
  order,
  locale,
  activeCurrency,
  onAccept,
  onReject,
  onEditItems,
  onChangeTable,
  loading,
}: {
  order: PendingOrder;
  locale: string;
  activeCurrency: Currency;
  onAccept: () => void;
  onReject: () => void;
  onEditItems: () => void;
  onChangeTable?: () => void;
  loading: boolean;
}) {
  const showDate = !isToday(order.createdAt);

  return (
    <div className="flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm w-full h-full">
      {/* ── Header ── */}
      <div className="flex justify-between items-start p-3 border-b gap-2">
        <div className="flex flex-col items-start gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono truncate" style={{ color: "#5a4a3a" }}>
              {order.dailyOrderNumber != null ? `#${order.dailyOrderNumber}` : `#${order.id.slice(0, 8)}`}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: "#f5efdf", color: "#8a7a6a" }}>
              {formatTime(order.createdAt)}
            </span>
            {showDate && (
              <span className="text-[10px]" style={{ color: "#8a7a6a" }}>
                {order.createdAt.split("T")[0]}
              </span>
            )}
          </div>
          {order.customerName && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#eaf5e8", color: "#5a8a3a" }}>
              {order.customerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#3B2818" }}>
            {t(locale, "Table", "الطاولة")} {order.tableNumber}
          </span>
          {onChangeTable && (
            <button
              type="button"
              onClick={onChangeTable}
              className="min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center border-0 hover:bg-gray-100 transition-colors"
              title={t(locale, "Change Table", "تغيير الطاولة")}
            >
              <svg className="w-3.5 h-3.5" style={{ color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Body: Items ── */}
      <div className="px-4 py-3 flex-1">
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 leading-relaxed justify-between ${
                item.isAddedLater
                  ? "rounded-lg px-2 py-1.5 -mx-2"
                  : "py-0.5"
              }`}
              style={
                item.isAddedLater
                  ? { backgroundColor: "#fef3c7", animation: "kdsPulse 2s ease-in-out infinite" }
                  : undefined
              }
            >
              <div className="flex items-start gap-2 min-w-0">
                <span
                  className="text-base font-extrabold tabular-nums shrink-0 leading-snug"
                  style={{ color: "#3B2818", minWidth: "2em" }}
                >
                  {item.quantity}x
                </span>
                <div className="min-w-0">
                  <span className="text-base font-bold leading-snug" style={{ color: "#3B2818" }}>
                    {item.name}
                  </span>
                  {item.isAddedLater && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 ml-1.5 align-middle"
                      style={{ backgroundColor: "#ef4444", color: "#fff" }}
                    >
                      🔔 {t(locale, "New", "جديد")}
                    </span>
                  )}
                  {item.variant && (
                    <p className="text-xs mt-0.5" style={{ color: "#8a7a6a" }}>
                      {t(locale, "Size:", "الحجم:")} {item.variant}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs font-bold italic mt-0.5 flex items-center gap-1" style={{ color: "#dc2626" }}>
                      ⚠️ {item.notes}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums shrink-0 ml-2 whitespace-nowrap" style={{ color: "#3B2818" }}>
                {(() => {
                  const unitPrice = activeCurrency === "TRY" ? item.priceTry : item.priceSyp;
                  if (unitPrice != null) {
                    return formatCurrency(unitPrice * item.quantity, activeCurrency, locale);
                  }
                  return null;
                })()}
              </span>
            </div>
          ))}
        </div>

        {/* ── Totals ── */}
        <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>
            {t(locale, "Total", "المجموع")}
          </span>
          <div className="text-right">
            <p className="text-base font-bold tabular-nums" style={{ color: "#3B2818" }}>
              {formatCurrency(
                activeCurrency === "TRY" ? order.totalTry : order.totalSyp,
                activeCurrency,
                locale,
              )}
            </p>
            {order.totalUsd > 0 && (
              <p className="text-xs tabular-nums" style={{ color: "#8a7a6a" }}>
                {formatCurrency(order.totalUsd, "USD", locale)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer: Actions ── */}
      <div className="p-3 flex flex-col gap-2 border-t mt-auto" style={{ backgroundColor: "#f9fafb" }}>
        <button
          type="button"
          onClick={onEditItems}
          className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] border"
          style={{ backgroundColor: "#fff", color: "#5a4a3a", borderColor: "#dcc8b4" }}
        >
          {t(locale, "Edit / Add Items", "تعديل / إضافة أصناف")}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold active:scale-[0.98] transition-all border-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "#9a6a3a", color: "#fff" }}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {!loading && t(locale, "Accept", "قبول")}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold active:scale-[0.98] transition-all border-0 disabled:opacity-50"
            style={{ backgroundColor: "#fce8e8", color: "#b55a5a" }}
          >
            {t(locale, "Reject", "رفض")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingOrdersView({
  orders,
  locale,
  activeCurrency,
  onAccept,
  onReject,
  onEditItems,
  onChangeTable,
  loadingAction,
}: {
  orders: PendingOrder[];
  locale: string;
  activeCurrency: Currency;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onEditItems: (orderId: string) => void;
  onChangeTable?: (orderId: string, tableName: string) => void;
  loadingAction: string | null;
}) {
  if (orders.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <p className="text-sm" style={{ color: "#8a7a6a" }}>
          {t(locale, "No pending orders", "لا توجد طلبات قيد الانتظار")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 auto-rows-min">
      {orders.map((order) => (
        <PendingOrderCard
          key={order.id}
          order={order}
          locale={locale}
          activeCurrency={activeCurrency}
          onAccept={() => onAccept(order.id)}
          onReject={() => onReject(order.id)}
          onEditItems={() => onEditItems(order.id)}
          onChangeTable={onChangeTable ? () => onChangeTable(order.id, order.tableNumber) : undefined}
          loading={loadingAction === order.id}
        />
      ))}
    </div>
  );
}
