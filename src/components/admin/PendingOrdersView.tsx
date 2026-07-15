"use client";

import { useState, useMemo } from "react";
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
    <div className="break-inside-avoid mb-3 flex flex-col bg-white border rounded-lg overflow-hidden shadow-sm w-full">
      {/* ── Header ── */}
      <div className="flex justify-between items-center px-3 py-2 border-b gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-bold font-mono truncate" style={{ color: "#5a4a3a" }}>
            {order.dailyOrderNumber != null ? `#${order.dailyOrderNumber}` : `#${order.id.slice(0, 6)}`}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "#f5efdf", color: "#8a7a6a" }}>
            {formatTime(order.createdAt)}
          </span>
          {showDate && (
            <span className="text-[10px]" style={{ color: "#8a7a6a" }}>
              {order.createdAt.split("T")[0]}
            </span>
          )}
          {order.customerName && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "#eaf5e8", color: "#5a8a3a" }}>
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
              className="min-w-[24px] min-h-[24px] rounded-full flex items-center justify-center border-0 hover:bg-gray-100 transition-colors"
              title={t(locale, "Change Table", "تغيير الطاولة")}
            >
              <svg className="w-3 h-3" style={{ color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Body: Items ── */}
      <div className="px-3 py-2">
        <div className="space-y-1">
          {order.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-1.5 leading-snug justify-between ${
                item.isAddedLater
                  ? "rounded px-1.5 py-1"
                  : "py-0.5"
              }`}
              style={
                item.isAddedLater
                  ? { backgroundColor: "#fef3c7", animation: "kdsPulse 2s ease-in-out infinite" }
                  : undefined
              }
            >
              <div className="flex items-start gap-1.5 min-w-0">
                <span
                  className="text-sm font-extrabold tabular-nums shrink-0"
                  style={{ color: "#3B2818", minWidth: "1.6em" }}
                >
                  {item.quantity}x
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                    {item.name}
                  </span>
                  {item.isAddedLater && (
                    <span
                      className="text-[9px] px-1 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 ml-1 align-middle"
                      style={{ backgroundColor: "#ef4444", color: "#fff" }}
                    >
                      🔔 {t(locale, "New", "جديد")}
                    </span>
                  )}
                  {item.variant && (
                    <span className="text-[11px] ml-1" style={{ color: "#8a7a6a" }}>
                      ({item.variant})
                    </span>
                  )}
                  {item.notes && (
                    <p className="text-[11px] font-bold italic flex items-center gap-0.5" style={{ color: "#dc2626" }}>
                      ⚠️ {item.notes}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums shrink-0 ml-1.5 whitespace-nowrap" style={{ color: "#3B2818" }}>
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
        <div className="mt-2 pt-1.5 border-t border-border/30 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider" style={{ color: "#8a7a6a" }}>
            {t(locale, "Total", "المجموع")}
          </span>
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums" style={{ color: "#3B2818" }}>
              {formatCurrency(
                activeCurrency === "TRY" ? order.totalTry : order.totalSyp,
                activeCurrency,
                locale,
              )}
            </p>
            {order.totalUsd > 0 && (
              <p className="text-[10px] tabular-nums" style={{ color: "#8a7a6a" }}>
                {formatCurrency(order.totalUsd, "USD", locale)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer: Actions ── */}
      <div className="px-3 py-2 flex flex-col gap-1.5 border-t" style={{ backgroundColor: "#f9fafb" }}>
        <button
          type="button"
          onClick={onEditItems}
          className="w-full py-1.5 rounded-md text-[11px] font-semibold transition-all active:scale-[0.98] border"
          style={{ backgroundColor: "#fff", color: "#5a4a3a", borderColor: "#dcc8b4" }}
        >
          {t(locale, "Edit / Add Items", "تعديل / إضافة أصناف")}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="w-full py-1.5 rounded-md text-sm font-bold active:scale-[0.98] transition-all border-0 disabled:opacity-50 flex items-center justify-center gap-1"
            style={{ backgroundColor: "#9a6a3a", color: "#fff" }}
          >
            {loading && (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
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
            className="w-full py-1.5 rounded-md text-sm font-bold active:scale-[0.98] transition-all border-0 disabled:opacity-50"
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
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const id = o.id.slice(0, 8).toLowerCase();
      const dn = o.dailyOrderNumber ? String(o.dailyOrderNumber) : "";
      const table = o.tableNumber.toLowerCase();
      const customer = (o.customerName ?? "").toLowerCase();
      return id.includes(q) || dn.includes(q) || table.includes(q) || customer.includes(q);
    });
  }, [orders, search]);

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
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute top-1/2 -translate-y-1/2 w-4 h-4" style={{ [locale === "ar" ? "right" : "left"]: "12px", color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(locale, "Search by order #, table, or customer...", "ابحث برقم الطلب، الطاولة، أو اسم الزبون...")}
          className="w-full py-2.5 rounded-xl text-sm bg-white border border-[#dcc8b4] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9a6a3a]/30 transition-all shadow-sm"
          style={{ [locale === "ar" ? "paddingRight" : "paddingLeft"]: "36px" }}
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-surface rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <p className="text-sm" style={{ color: "#8a7a6a" }}>
            {t(locale, "No matching orders", "لا توجد طلبات مطابقة")}
          </p>
        </div>
      ) : (
        <div className="w-full columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
          {filteredOrders.map((order) => (
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
      )}
    </div>
  );
}
