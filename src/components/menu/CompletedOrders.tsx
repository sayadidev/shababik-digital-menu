"use client";

import { useState } from "react";
import { useActiveOrder } from "@/context/ActiveOrderContext";
import { formatCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

export default function CompletedOrders({ locale, activeCurrency, enableUsd = true }: { locale: string; activeCurrency: Currency; enableUsd?: boolean }) {
  const { completedOrders } = useActiveOrder();
  const [open, setOpen] = useState(false);
  const isRtl = locale === "ar";

  if (completedOrders.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[100px] left-4 right-4 z-30 mx-auto bg-white border border-[#E8E6E1] shadow-lg rounded-2xl px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
        style={{ maxWidth: "420px" }}
      >
        <div className="flex items-center gap-3" dir={isRtl ? "rtl" : "ltr"}>
          <div className="w-9 h-9 rounded-full bg-[#3B2818]/8 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" style={{ color: "#3B2818" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div className="text-left rtl:text-right">
            <p className="text-sm font-bold" style={{ color: "#3B2818" }}>
              {locale === "ar" ? "طلباتي" : "My Orders"}
            </p>
            <p className="text-[11px]" style={{ color: "#8a7a6a" }}>
              {completedOrders.length === 1
                ? (locale === "ar" ? "طلب واحد مكتمل" : "1 completed order")
                : (locale === "ar"
                  ? `${completedOrders.length} طلبات مكتملة`
                  : `${completedOrders.length} completed orders`)}
            </p>
          </div>
        </div>
        <svg className="w-5 h-5 shrink-0" style={{ color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
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
                          #{order.orderId.slice(0, 8)}
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
                            {item.name}
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
                onClick={() => setOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 transition-all border-0"
              >
                {locale === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
