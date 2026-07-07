"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCart } from "@/context/CartContext";
import type { ItemWithVariants } from "@/lib/menu";
import type { ItemVariant } from "@/types/database";
import { formatSyp } from "@/lib/format-currency";

type Props = {
  item: ItemWithVariants | null;
  variant: ItemVariant | null;
  locale: string;
  enableUsd: boolean;
  onClose: () => void;
};

export default function AddToCartSheet({ item, variant, locale, enableUsd, onClose }: Props) {
  const { addItem } = useCart();
  const [visible, setVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(variant);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const isRtl = locale === "ar";

  useEffect(() => {
    if (!item) return;
    setSelectedVariant(variant);
    setQuantity(1);
    setNotes("");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setVisible(true));
    return () => {
      document.body.style.overflow = "";
    };
  }, [item, variant]);

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

  const handleAddToCart = () => {
    if (!item || !selectedVariant) return;
    addItem(
      {
        itemId: item.id,
        variantId: selectedVariant.id,
        nameEn: item.name_en,
        nameAr: item.name_ar,
        imageUrl: item.image_url,
        variantNameEn: selectedVariant.size_name_en,
        variantNameAr: selectedVariant.size_name_ar,
        priceUsd: selectedVariant.price_usd,
        priceSyp: selectedVariant.price_syp,
      },
      quantity,
      notes.trim() || undefined,
    );
    handleClose();
  };

  if (!item || !selectedVariant) return null;

  const name = locale === "ar" ? item.name_ar : item.name_en;
  const description = locale === "ar" ? item.description_ar : item.description_en;
  const totalPriceUsd = (selectedVariant.price_usd * quantity).toFixed(2);
  const totalPriceSyp = selectedVariant.price_syp * quantity;
  const isOffer = selectedVariant.is_offer && selectedVariant.price_before_usd != null;
  const beforePriceUsd = isOffer ? (selectedVariant.price_before_usd! * quantity).toFixed(2) : null;
  const beforePriceSyp = isOffer && selectedVariant.price_before_syp != null
    ? selectedVariant.price_before_syp! * quantity
    : null;

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
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
          isDragging.current = true;
        }}
        onTouchMove={(e) => {
          if (!isDragging.current) return;
          const dy = e.touches[0].clientY - touchStartY.current;
          if (dy > 0) setDragOffset(dy);
        }}
        onTouchEnd={() => {
          isDragging.current = false;
          if (dragOffset > 100) {
            handleClose();
          }
          setDragOffset(0);
        }}
        className="relative w-full max-w-lg mx-4 transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          transform: visible
            ? dragOffset > 0
              ? `translateY(${dragOffset}px)`
              : "translateY(0)"
            : "translateY(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          className="rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col bg-[#f5efdf] overflow-hidden"
          style={{ maxHeight: "90dvh" }}
        >
          <div className="relative w-full h-64 shrink-0 overflow-hidden">
            <span className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/60 backdrop-blur-sm rounded-full z-20" />
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#D4B895]/20">
                <svg className="h-16 w-16 text-[#3B2818]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60 active:scale-90 transition-all"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0" dir={isRtl ? "rtl" : "ltr"}>
            <div className="p-5">
              <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {description}
                </p>
              )}

              {item.item_variants.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {item.item_variants.map((v) => {
                    const vName = locale === "ar" ? v.size_name_ar : v.size_name_en;
                    const isActive = v.id === selectedVariant.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          isActive
                            ? "bg-[#8C6B4A] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span className="font-medium">{vName}</span>
                        <span className={`mx-1 ${isActive ? "opacity-60" : "opacity-30"}`}>-</span>
                        <span className="font-semibold">
                          {enableUsd
                            ? `$${v.price_usd.toFixed(2)}`
                            : formatSyp(v.price_syp, locale)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {locale === "ar" ? "ملاحظات الطلب" : "Order Notes"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={locale === "ar" ? "مثلاً: بدون سكر، ثلج إضافي..." : "e.g. No sugar, extra ice..."}
                  rows={2}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8C6B4A]/20 focus:border-[#8C6B4A]"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 w-full bg-[#FDFBF7] border-t border-[#E8E6E1] p-4 flex flex-col gap-4 z-50" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <div className={`flex justify-between items-center w-full ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="flex items-center gap-3 bg-[#F0EBE1] px-3 py-1.5 rounded-full" dir="ltr">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#E5DFD5] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-sm font-bold tabular-nums min-w-[1.5rem] text-center text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[#8C6B4A] text-white hover:bg-[#6B4A3A] transition-all active:scale-90"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col items-end">
                {isOffer && enableUsd && beforePriceUsd && (
                  <span className="text-xs font-medium text-gray-400 line-through mb-0.5">
                    ${beforePriceUsd} / {formatSyp(beforePriceSyp!, locale)}
                  </span>
                )}
                {isOffer && !enableUsd && beforePriceSyp && (
                  <span className="text-xs font-medium text-gray-400 line-through mb-0.5">
                    {formatSyp(beforePriceSyp, locale)}
                  </span>
                )}
                {enableUsd ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-gray-900 tabular-nums">
                      ${totalPriceUsd}
                    </span>
                    <span className="text-xs font-medium text-gray-500 tabular-nums">
                      / {formatSyp(totalPriceSyp, locale)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xl font-bold text-gray-900 tabular-nums">
                    {formatSyp(totalPriceSyp, locale)}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full bg-[#3C3025] text-white text-base font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-transform"
            >
              {locale === "ar" ? "إضافة للسلة" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
