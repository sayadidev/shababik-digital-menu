"use client";

import { useState, useEffect, useRef } from "react";
import { useActiveOrder } from "@/context/ActiveOrderContext";
import { submitOrderFeedback } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

type StatusConfig = {
  bg: string;
  text: { ar: string; en: string };
  icon: React.ReactNode;
};

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "pending":
      return {
        bg: "bg-amber-500",
        text: { ar: "تم إرسال الطلب...", en: "Order sent..." },
        icon: (
          <span className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
        ),
      };
    case "processing":
      return {
        bg: "bg-[#8C6B4A]",
        text: { ar: "طلبك قيد التحضير...", en: "Your order is being prepared..." },
        icon: (
          <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ),
      };
    case "completed":
      return {
        bg: "bg-emerald-600",
        text: { ar: "طلبك جاهز!", en: "Your Order is Ready!" },
        icon: (
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    default:
      return {
        bg: "bg-amber-500",
        text: { ar: "تم إرسال الطلب...", en: "Order sent..." },
        icon: (
          <span className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
        ),
      };
  }
}

export default function FloatingActiveOrder({ locale, activeCurrency, enableUsd = true }: { locale: string; activeCurrency: Currency; enableUsd?: boolean }) {
  const { activeOrder, setActiveOrder, feedbackPrompted, markOrderPrompted } = useActiveOrder();
  const [showModal, setShowModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const prevOrderIdRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const statusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeOrder) {
      setShowModal(false);
      setIsMinimized(false);
      prevOrderIdRef.current = null;
      prevStatusRef.current = null;
      return;
    }

    const orderId = activeOrder.orderId;
    const status = activeOrder.status;
    const isNewOrder = prevOrderIdRef.current !== orderId;
    const prevStatus = prevStatusRef.current;

    const isCompleted = status === "completed";
    const alreadyPrompted = feedbackPrompted.includes(orderId);

    if (isCompleted) {
      if (!alreadyPrompted) {
        setShowModal(true);
        setIsMinimized(false);
      }
    } else if (isNewOrder || (prevStatus && prevStatus !== status)) {
      setShowModal(true);
      setIsMinimized(false);
    }

    prevOrderIdRef.current = orderId;
    prevStatusRef.current = status;
  }, [activeOrder?.orderId, activeOrder?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMinimized && activeOrder && statusRef.current !== activeOrder.status) {
      setIsMinimized(false);
      setShowModal(true);
    }
    statusRef.current = activeOrder?.status ?? null;
  }, [activeOrder?.status, isMinimized]);

  if (!activeOrder) return null;

  const isRtl = locale === "ar";
  const shortId = activeOrder.orderId.slice(0, 5).toUpperCase();
  const config = getStatusConfig(activeOrder.status);
  const isReady = activeOrder.status === "completed";

  const handleDismiss = () => {
    setShowModal(false);
    setIsMinimized(true);
  };

  const handleFinalDismiss = () => {
    setIsMinimized(false);
    markOrderPrompted(activeOrder.orderId);
    setActiveOrder(null);
    setShowModal(false);
    setRating(0);
    setFeedbackText("");
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await submitOrderFeedback(
        activeOrder.orderId,
        rating,
        feedbackText || undefined,
      );
    } catch {}
    setSubmitting(false);
    handleFinalDismiss();
  };

  const handleSkip = () => {
    handleFinalDismiss();
  };

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={isReady ? undefined : handleDismiss}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !isReady) handleDismiss();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={locale === "ar" ? "حالة الطلب" : "Order Status"}
          tabIndex={-1}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={isReady ? undefined : handleDismiss}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mx-4 bg-[#f5efdf] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300"
            style={{ maxHeight: "80dvh" }}
          >
            <div className="shrink-0 flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-[#dcc8b4]/60" />
            </div>

            {isReady ? (
              <div className="p-7" dir={isRtl ? "rtl" : "ltr"}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    {locale === "ar" ? "طلبك جاهز!" : "Your Order is Ready!"}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[300px] mx-auto mt-2">
                    {locale === "ar"
                      ? "نتمنى أن تستمتع بطلبك. رأيك يهمنا جداً لنستمر بتقديم الأفضل لك."
                      : "We hope you enjoy your order. Your opinion matters to help us serve you better."}
                  </p>
                </div>

                <div className="flex justify-center gap-2 mb-8" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <svg
                        className="w-9 h-9"
                        viewBox="0 0 24 24"
                        fill={(hoverRating || rating) >= star ? "#F59E0B" : "#E5E7EB"}
                        stroke={(hoverRating || rating) >= star ? "#D97706" : "#D1D5DB"}
                        strokeWidth={1}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={locale === "ar"
                    ? "أخبرنا المزيد عن تجربتك (اختياري)..."
                    : "Tell us more about your experience (optional)..."}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                />

                <div className="flex gap-3 mt-5">
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={submitting}
                    className="flex-1 min-h-[48px] py-3.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-gray-200"
                  >
                    {locale === "ar" ? "تخطي" : "Skip"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="flex-1 min-h-[48px] py-3.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: rating > 0 ? "#1a1a1a" : "#d1d5db",
                      color: "#fff",
                    }}
                  >
                    {submitting && (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {locale === "ar" ? "إرسال التقييم" : "Submit Feedback"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5" dir={isRtl ? "rtl" : "ltr"}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${config.bg}/10 flex items-center justify-center`}>
                    <div className={config.bg.replace("bg-", "text-")}>
                      {config.icon}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {locale === "ar" ? "حالة الطلب" : "Order Status"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      #{shortId} &middot; {locale === "ar" ? `الطاولة ${activeOrder.tableNumber}` : `Table ${activeOrder.tableNumber}`}
                    </p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${config.bg} mb-4`}>
                  {config.icon}
                  {locale === "ar" ? config.text.ar : config.text.en}
                </div>

                <div className="space-y-2 mb-5">
                  {activeOrder.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between py-1.5 border-b border-[#E8E6E1]/40">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm text-gray-900 font-bold">{item.name}</span>
                          {item.variant && (
                            <span className="text-xs text-gray-500">{item.variant}</span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-red-600 font-bold mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 shrink-0 ml-3 font-bold">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E6E1]">
                  <span className="text-sm font-bold text-gray-900">
                    {locale === "ar" ? "المجموع" : "Total"}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(
                        activeCurrency === "TRY" ? activeOrder.totalTry : activeOrder.totalSyp,
                        activeCurrency,
                        locale,
                      )}
                    </p>
                    {enableUsd && activeOrder.totalUsd > 0 && (
                      <p className="text-xs text-gray-400">
                        {formatCurrency(activeOrder.totalUsd, "USD", locale)}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full min-h-[44px] mt-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:scale-[0.98] transition-all"
                >
                  {locale === "ar" ? "تصغير" : "Minimize"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isMinimized && !showModal && (
        <div
          onClick={() => {
            setIsMinimized(false);
            setShowModal(true);
          }}
          className="fixed bottom-6 left-4 right-4 bg-white border border-[#E8E6E1] shadow-xl rounded-2xl p-4 flex items-center justify-between z-50 cursor-pointer active:scale-[0.98] transition-transform max-w-lg mx-auto"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsMinimized(false);
              setShowModal(true);
            }
          }}
        >
          <div className="flex items-center gap-3" dir={isRtl ? "rtl" : "ltr"}>
            <div className={`w-8 h-8 rounded-full ${config.bg}/10 flex items-center justify-center shrink-0`}>
              <div className={config.bg.replace("bg-", "text-")}>
                {config.icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {locale === "ar" ? config.text.ar : config.text.en}
              </p>
              <p className="text-xs text-gray-500">
                #{shortId}
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      )}
    </>
  );
}
