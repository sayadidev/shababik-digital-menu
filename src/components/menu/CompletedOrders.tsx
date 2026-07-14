"use client";

import { useActiveOrder } from "@/context/ActiveOrderContext";
import { formatCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

export default function CompletedOrdersSheet({ open, onClose, locale, activeCurrency, enableUsd = true }: { open: boolean; onClose: () => void; locale: string; activeCurrency: Currency; enableUsd?: boolean }) {
  const { completedOrders } = useActiveOrder();
  const isRtl = locale === "ar";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#f5efdf] rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "80dvh", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        <div className="shrink-0 flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-[#dcc8b4]/60" />
        </div>
        <div className="shrink-0 px-5 pb-3">
          <h2 className="text-lg font-bold text-center" style={{ color: "#3B2818" }}>
            {locale === "ar" ? "طلباتي" : "My Orders"}
          </h2>
          <p className="text-xs text-center mt-1" style={{ color: "#8a7a6a" }}>
            {locale === "ar"
              ? "سجل الطلبات في هذه الجلسة — اعرضها عند المحاسبة"
              : "Orders from this session — show at checkout"}
          </p>
        </div>

        <div className="px-5 overflow-y-auto flex-1 min-h-0" dir={isRtl ? "rtl" : "ltr"}>
          <div className="space-y-3 pb-4">
            {completedOrders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold" style={{ color: "#8a7a6a" }}>
                      {order.dailyOrderNumber != null ? `#${order.dailyOrderNumber}` : `#${order.orderId.slice(0, 8)}`}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                      {locale === "ar" ? "مكتمل" : "Completed"}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "#8a7a6a" }}>
                    {locale === "ar" ? `الطاولة ${order.tableNumber}` : `Table ${order.tableNumber}`}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span style={{ color: "#3B2818" }}>
                        <span className="font-bold">{item.quantity}x</span>{" "}
                        {locale === "ar" ? item.name : item.nameEn || item.name}
                        {item.variant && <span style={{ color: "#8a7a6a" }}> — {item.variant}</span>}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E6E1]/40">
                  <span className="text-xs font-bold" style={{ color: "#8a7a6a" }}>
                    {locale === "ar" ? "المجموع" : "Total"}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums" style={{ color: "#3B2818" }}>
                      {formatCurrency(
                        activeCurrency === "TRY" ? order.totalTry : order.totalSyp,
                        activeCurrency,
                        locale,
                      )}
                    </p>
                    {enableUsd && order.totalUsd > 0 && (
                      <p className="text-[10px] tabular-nums" style={{ color: "#8a7a6a" }}>
                        {formatCurrency(order.totalUsd, "USD", locale)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 transition-all border-0"
          >
            {locale === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompletedOrdersBadge({ onClick, locale }: { onClick: () => void; locale: string }) {
  const { completedOrders } = useActiveOrder();

  if (completedOrders.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center bg-[#3B2818]/8 hover:bg-[#3B2818]/15 transition-all border-0"
      aria-label={locale === "ar" ? "طلباتي" : "My Orders"}
    >
      <svg className="w-5 h-5" style={{ color: "#3B2818" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1"
        style={{ boxShadow: "0 1px 3px rgba(239,68,68,0.5)" }}>
        {completedOrders.length > 9 ? "9+" : completedOrders.length}
      </span>
    </button>
  );
}
