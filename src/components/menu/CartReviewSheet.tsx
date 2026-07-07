"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { useActiveOrder } from "@/context/ActiveOrderContext";
import { useToast } from "./Toast";
import { createOrder } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

const COOLDOWN_MS = 15 * 60 * 1000;

type Props = {
  tableNumber: number | null;
  locale: string;
  activeCurrency: Currency;
  onClose: () => void;
  isStaff: boolean;
  onTableNumberChange?: (n: number) => void;
};

export default function CartReviewSheet({ tableNumber, locale, activeCurrency, onClose, isStaff, onTableNumberChange }: Props) {
  const { items, updateQuantity, removeItem, totalItems, totalPriceUsd, totalPriceSyp, totalPriceTry, clearCart } = useCart();
  const { setActiveOrder } = useActiveOrder();
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editableTable, setEditableTable] = useState(tableNumber ?? 1);
  const isRtl = locale === "ar";
  const { show: showToast } = useToast();

  const effectiveTable = isStaff ? editableTable : tableNumber;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setVisible(true));
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose],
  );

  const handleSubmit = async () => {
    if (totalItems === 0) return;

    // ── Table number required ──
    if (!effectiveTable) {
      showToast(
        locale === "ar"
          ? "يرجى مسح رمز الـ QR الموجود على طاولتك لإتمام الطلب"
          : "Please scan the QR code on your table to complete the order",
        "error",
      );
      return;
    }

    // ── Rate limit check (skip for staff) ──
    if (!isStaff) {
      try {
        const lastTimestamp = localStorage.getItem("last_order_timestamp");
        if (lastTimestamp) {
          const elapsed = Date.now() - parseInt(lastTimestamp, 10);
          if (elapsed < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
            showToast(
              locale === "ar"
                ? `عذراً، يرجى الانتظار ${remaining} دقيقة قبل إرسال طلب جديد`
                : `Please wait ${remaining} min before ordering again`,
              "error",
            );
            return;
          }
        }
      } catch {}
    }

    setSubmitting(true);

    // ── Real database submission ──
    const res = await createOrder({
      table_number: effectiveTable,
      items: items.map((item) => ({
        name: locale === "ar" ? item.nameAr : item.nameEn,
        quantity: item.quantity,
        variant: locale === "ar" ? item.variantNameAr : item.variantNameEn,
        notes: item.notes || undefined,
      })),
      total_usd: totalPriceUsd,
      total_syp: totalPriceSyp,
      total_try: totalPriceTry,
    });

    if (res.success) {
      if (!isStaff) {
        localStorage.setItem("last_order_timestamp", String(Date.now()));
      }
      if (res.orderId) {
        setActiveOrder({
          orderId: res.orderId,
          tableNumber: effectiveTable ?? 1,
          totalUsd: totalPriceUsd,
          totalSyp: totalPriceSyp,
          totalTry: totalPriceTry,
          status: "pending",
          items: items.map((item) => ({
            name: locale === "ar" ? item.nameAr : item.nameEn,
            variant: locale === "ar" ? item.variantNameAr : item.variantNameEn,
            quantity: item.quantity,
            notes: item.notes || undefined,
          })),
          createdAt: new Date().toISOString(),
        });
      }
      showToast(
        locale === "ar" ? "تم إرسال طلبك بنجاح!" : "Order submitted successfully!",
        "success",
      );
      clearCart();
      handleClose();
    } else {
      showToast(
        res.error ?? (locale === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again"),
        "error",
      );
    }

    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className={`absolute inset-0 transition-all duration-300 ${visible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"}`}
        onClick={handleClose}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg mx-4 transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col bg-[#f5efdf]" style={{ maxHeight: "85dvh" }}>
          {/* Handle */}
          <div className="shrink-0 flex justify-center pt-3 pb-1">
            <span className="h-1 w-10 rounded-full bg-[#dcc8b4]/60" />
          </div>

          {/* Header */}
          <div className="shrink-0 px-5 flex items-center justify-between mb-1" dir={isRtl ? "rtl" : "ltr"}>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {locale === "ar" ? "مراجعة الطلب" : "Review Order"}
              </h2>
              {isStaff ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <label htmlFor="table-number" className="text-xs text-gray-500">
                    {locale === "ar" ? "رقم الطاولة:" : "Table #:"}
                  </label>
                  <input
                    id="table-number"
                    type="number"
                    min={1}
                    value={editableTable}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (n > 0) {
                        setEditableTable(n);
                        onTableNumberChange?.(n);
                      }
                    }}
                    className="w-16 px-2 py-1 rounded-lg text-xs font-bold bg-white border border-[#dcc8b4] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669]/30 transition-all"
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {locale === "ar" ? `طاولة رقم ${tableNumber}` : `Table ${tableNumber}`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-[#3B2818]/4"
              aria-label="Close review"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items List */}
          <div className="px-5 overflow-y-auto flex-1 min-h-0" dir={isRtl ? "rtl" : "ltr"}>
            <div className="divide-y divide-[#E8E6E1]/40">
              {items.map((item) => (
                <div key={item.variantId} className="py-3 flex items-start gap-3">
                  {item.imageUrl ? (
                    <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden">
                      <img src={item.imageUrl} alt={item.nameEn} className="w-16 h-16 object-cover" />
                    </div>
                  ) : (
                    <div className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center bg-[#F4F0EA]">
                      <svg className="w-5 h-5 text-[#3B2818]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900">
                      {locale === "ar" ? item.nameAr : item.nameEn}
                    </h4>
                    {item.variantNameEn && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {locale === "ar" ? item.variantNameAr : item.variantNameEn}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs mt-0.5 italic text-[#8C6B4A]">
                        {item.notes}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm font-semibold text-[#8C6B4A] tabular-nums">
                        {formatCurrency(
                          ((activeCurrency === "TRY" ? item.priceTry : activeCurrency === "USD" ? item.priceUsd : item.priceSyp) * item.quantity),
                          activeCurrency,
                          locale,
                        )}
                      </span>
                    </div>
                    </div>

                  <div className="flex items-center gap-2 bg-[#F0EBE1] px-2 py-1 rounded-full text-sm font-medium shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, -1)}
                      className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-gray-600 hover:bg-[#E5DFD5] transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="tabular-nums min-w-[1rem] text-center text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, 1)}
                      className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-gray-600 hover:bg-[#E5DFD5] transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#E8E6E1] pt-4 mt-4 px-5 pb-8">
            <div className="flex items-center justify-between mb-5" dir={isRtl ? "rtl" : "ltr"}>
              <span className="text-lg font-bold text-gray-900">
                {locale === "ar" ? "المجموع" : "Total"}
              </span>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-gray-900">
                  {formatCurrency(
                    activeCurrency === "TRY" ? totalPriceTry : activeCurrency === "USD" ? totalPriceUsd : totalPriceSyp,
                    activeCurrency,
                    locale,
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full min-h-[48px] bg-[#5A4A3A] text-white py-3.5 rounded-xl font-semibold mb-2 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {locale === "ar" ? "تأكيد وإرسال للمطبخ" : "Confirm & Send"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full min-h-[44px] text-gray-500 py-2 text-sm font-medium hover:bg-black/5 rounded-xl transition-colors"
            >
              {locale === "ar" ? "إضافة المزيد" : "Add More"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
