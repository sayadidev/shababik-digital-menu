"use client";

import { useState } from "react";
import { useActiveOrder } from "@/context/ActiveOrderContext";
import { submitOrderFeedback } from "@/lib/actions/orders";

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
        text: { ar: "طلبك جاهز!", en: "Order is ready!" },
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

export default function FloatingActiveOrder({ locale }: { locale: string }) {
  const { activeOrder, setActiveOrder } = useActiveOrder();
  const [showModal, setShowModal] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!activeOrder) return null;

  const isRtl = locale === "ar";
  const shortId = activeOrder.orderId.slice(0, 5).toUpperCase();
  const config = getStatusConfig(activeOrder.status);
  const isReady = activeOrder.status === "completed";

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setActiveOrder(null);
      setShowModal(false);
      setRating(0);
      setFeedbackText("");
    }, 300);
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
    handleDismiss();
  };

  const handleSkip = () => {
    handleDismiss();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`fixed bottom-4 left-4 right-4 ${config.bg} text-white p-3 rounded-2xl shadow-xl flex justify-between items-center z-40 active:scale-[0.98] transition-all duration-300`}
        style={{
          maxWidth: "min(calc(100vw - 2rem), 36rem)",
          margin: "0 auto",
          opacity: exiting ? 0 : 1,
          transform: exiting ? "translateY(20px)" : "translateY(0)",
          animation: isReady ? "orderReadyBounce 0.6s ease-out" : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          {config.icon}
          <span className="text-sm font-medium text-left rtl:text-right">
            {locale === "ar" ? config.text.ar : config.text.en}
          </span>
        </div>
        <span className="text-sm font-bold opacity-80 font-mono">
          #{shortId}
        </span>
      </button>

      <style>{`
        @keyframes orderReadyBounce {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mx-4 bg-[#f5efdf] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "80dvh" }}
          >
            <div className="shrink-0 flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-[#dcc8b4]/60" />
            </div>

            {isReady ? (
              <div className="p-5" dir={isRtl ? "rtl" : "ltr"}>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {locale === "ar" ? "شكراً لطلبك!" : "Thank You!"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {locale === "ar" ? "كيف كانت تجربتك؟" : "How was your experience?"}
                  </p>
                </div>

                {/* Star Rating */}
                <div className="flex justify-center gap-1.5 mb-5" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all duration-150 hover:scale-110 active:scale-95"
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

                {/* Optional feedback text */}
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={locale === "ar" ? "أخبرنا المزيد عن تجربتك (اختياري)" : "Tell us more about your experience (optional)"}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-[#E8E6E1] text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#9a6a3a]/30 transition-all"
                />

                {/* Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-[#E8E6E1] text-gray-600 text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {locale === "ar" ? "تخطي / إغلاق" : "Skip / Close"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {locale === "ar" ? "إرسال التقييم" : "Submit"}
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
                      #{shortId} &middot; {locale === "ar" ? `طاولة ${activeOrder.tableNumber}` : `Table ${activeOrder.tableNumber}`}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${config.bg} mb-4`}>
                  {config.icon}
                  {locale === "ar" ? config.text.ar : config.text.en}
                </div>

                <div className="space-y-2 mb-5">
                  {activeOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#E8E6E1]/40">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-gray-900 font-medium">{item.name}</span>
                        {item.notes && (
                          <p className="text-xs text-gray-400 truncate">{item.notes}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 shrink-0 ml-3">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E6E1]">
                  <span className="text-sm font-bold text-gray-900">
                    {locale === "ar" ? "المجموع" : "Total"}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ${activeOrder.totalUsd.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activeOrder.totalSyp.toLocaleString()} {locale === "ar" ? "ل.س" : "SYP"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    handleDismiss();
                  }}
                  className="w-full mt-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:scale-[0.98] transition-all"
                >
                  {locale === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
