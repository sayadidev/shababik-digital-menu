"use client";

import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

const P = {
  deep: "#3B2818",
  accent: "#B8743A",
  warm: "#D4B895",
};

export default function FloatingCart({
  locale,
  tableNumber,
  activeCurrency,
  enableUsd,
  onReview,
}: {
  locale: string;
  tableNumber: number | null;
  activeCurrency: Currency;
  enableUsd: boolean;
  onReview: () => void;
}) {
  const { totalItems, totalPriceUsd, totalPriceSyp, totalPriceTry } = useCart();

  if (totalItems === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ease-out"
      style={{ animation: "cartSlideUp 0.4s cubic-bezier(0.32,0.72,0,1)" }}
    >
      <div
        className="mx-auto px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
        style={{ maxWidth: "min(100vw, 1200px)" }}
      >
        <button
          type="button"
          onClick={onReview}
          className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 border-0 cursor-pointer"
          style={{
            backgroundColor: `${P.deep}ec`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: `0 4px 24px ${P.deep}40`,
          }}
        >
          {/* Cart Icon with Badge */}
          <span className="relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span
              className="absolute -top-1 -end-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                backgroundColor: "#ef4444",
                boxShadow: `0 2px 6px rgba(239,68,68,0.5)`,
                padding: "0 4px",
              }}
            >
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          </span>

          {/* Total Price */}
          <div className="flex-1 min-w-0 text-left rtl:text-right">
            <p className="text-xs text-white/60" style={{ fontVariantNumeric: "tabular-nums" }}>
              {locale === "ar" ? "المجموع" : "Total"}
            </p>
            <p className="text-sm font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(
                activeCurrency === "TRY" ? totalPriceTry : totalPriceSyp,
                activeCurrency,
                locale,
              )}
            </p>
            {enableUsd && totalPriceUsd > 0 && (
              <p className="text-[11px] text-white/70" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(totalPriceUsd, "USD", locale)}
              </p>
            )}
          </div>

          {/* CTA */}
          <span className="shrink-0 px-5 py-3 rounded-xl text-sm font-bold tracking-wide border-0" style={{ backgroundColor: P.accent, color: "#fff", boxShadow: `0 4px 12px ${P.accent}50` }}>
            {locale === "ar" ? "مراجعة" : "Review"}
          </span>
        </button>
      </div>

      <style>{`
        @keyframes cartSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
