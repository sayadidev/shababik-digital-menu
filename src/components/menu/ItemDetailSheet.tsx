"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/actions/analytics";
import type { ItemWithVariants } from "@/lib/menu";
import { formatCurrency, getBeforePriceForCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

const P = {
  deep: "#3B2818",
  warm: "#D4B895",
  bg: "#f5efdf",
  surface: "#fffcf8",
  text: "#2c1a0e",
  muted: "#7a6a56",
  accent: "#B8743A",
  border: "#dcc8b4",
};

type Props = {
  item: ItemWithVariants | null;
  onClose: () => void;
  activeCurrency: Currency;
  enableUsd?: boolean;
};

export default function ItemDetailSheet({ item, onClose, activeCurrency, enableUsd = true }: Props) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [imageIndex, setImageIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const selectedVariant = item?.item_variants.find((v) => v.id === selectedVariantId) ?? null;
  const displayImage = selectedVariant?.image_url || item?.image_url || "";

  const allImages = item
    ? [
        item.image_url,
        ...item.item_images
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => img.image_url),
      ].filter(Boolean)
    : [];

  const name = item ? (locale === "ar" ? item.name_ar : item.name_en) : "";
  const description = item
    ? locale === "ar"
      ? item.description_ar
      : item.description_en
    : "";

  useEffect(() => {
    if (!item) return;
    setSelectedVariantId(null);
    trackEvent("item_tap", item.id).catch(() => {});
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setVisible(true));
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!item) return null;

  const isRtl = locale === "ar";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      tabIndex={-1}
    >
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          visible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
        }`}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg mx-4 transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: P.bg }}>
          <div className="flex justify-center pt-3 pb-1">
            <span className="h-1 w-10 rounded-full" style={{ backgroundColor: `${P.border}99` }} />
          </div>

          {/* ── Image with padding ────────────── */}
          <div className="px-4">
            <div className="aspect-square w-full relative rounded-2xl overflow-hidden bg-white/40">
              {selectedVariant?.image_url ? (
                <Image
                  src={selectedVariant.image_url}
                  alt={`${name} - ${locale === "ar" ? selectedVariant.size_name_ar : selectedVariant.size_name_en}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 512px"
                  className="object-cover object-bottom"
                  priority
                />
              ) : allImages.length > 0 ? (
                <>
                  {allImages.map((src, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                      style={{ opacity: i === imageIndex ? 1 : 0 }}
                    >
                      <Image
                        src={src}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 100vw, 512px"
                        className="object-cover object-bottom"
                        priority={i === 0}
                      />
                    </div>
                  ))}

                  {/* Close button — overlaid on image */}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-3 end-3 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 active:scale-90 transition-all flex items-center justify-center border-0"
                    aria-label="Close detail view"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setImageIndex((i) =>
                            i === 0 ? allImages.length - 1 : i - 1,
                          )
                        }
                        className="absolute top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-black/25 text-white backdrop-blur-md hover:bg-black/45 active:scale-90 transition-all flex items-center justify-center border-0"
                        style={isRtl ? { right: "0.75rem" } : { left: "0.75rem" }}
                        aria-label="Previous image"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImageIndex((i) =>
                            i === allImages.length - 1 ? 0 : i + 1,
                          )
                        }
                        className="absolute top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-black/25 text-white backdrop-blur-md hover:bg-black/45 active:scale-90 transition-all flex items-center justify-center border-0"
                        style={isRtl ? { left: "0.75rem" } : { right: "0.75rem" }}
                        aria-label="Next image"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                        </svg>
                      </button>
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                        {allImages.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setImageIndex(i)}
                            className="min-h-[44px] flex items-center justify-center border-0 bg-transparent p-0"
                            aria-label={`Image ${i + 1} of ${allImages.length}`}
                          >
                            <span
                              className="rounded-full transition-all duration-300 block"
                              style={{
                                width: i === imageIndex ? "1.5rem" : "0.5rem",
                                height: "0.5rem",
                                backgroundColor: i === imageIndex ? "#fff" : "rgba(255,255,255,0.5)",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${P.warm}30` }}>
                  <svg className="h-16 w-16" style={{ color: `${P.deep}30` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* ── Content ───────────────────────── */}
          <div className="max-h-[55vh] overflow-y-auto px-5 pt-4 pb-6" dir={isRtl ? "rtl" : "ltr"}>
            {item.is_bestseller && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3"
                style={{ backgroundColor: `${P.accent}20`, color: P.accent }}>
                {t("bestseller")}
              </span>
            )}

            <h2 className="text-xl font-bold leading-tight" style={{ color: P.deep }}>{name}</h2>

            {description && (
              <p className="mt-2 text-sm leading-relaxed" style={{ color: P.muted }}>
                {description}
              </p>
            )}

            <div className="mt-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: P.deep }}>
                    {locale === "ar" ? "الأسعار" : "Pricing"}
                  </h3>
                  <div className="divide-y" style={{ borderColor: `${P.border}30` }}>
                    {item.item_variants.map((v) => {
                      const sizeName =
                        locale === "ar" ? v.size_name_ar : v.size_name_en;
                      const isSelected = selectedVariantId === v.id;
                      const hasImage = !!v.image_url;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            setSelectedVariantId(isSelected ? null : v.id)
                          }
                          className="w-full flex items-center justify-between py-2.5 gap-3 hover:bg-[#3B2818]/5 active:bg-[#3B2818]/10 transition-colors rounded-lg px-2 -mx-2 border-0 bg-transparent cursor-pointer"
                          style={{
                            outline: isSelected ? `2px solid ${P.accent}60` : "none",
                            outlineOffset: "-4px",
                          }}
                        >
                          {hasImage && (
                            <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-white/40">
                              <Image
                                src={v.image_url}
                                alt={sizeName}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <span className="text-sm font-medium flex-1 text-start" style={{ color: P.deep }}>
                            {sizeName}
                          </span>
                          <div className="flex items-baseline gap-2">
                            {v.is_offer && v.price_before_usd != null && (
                              <span className="text-xs line-through opacity-50 tabular-nums" style={{ color: P.muted }}>
                                {formatCurrency(v.price_before_usd, "USD", locale)}
                              </span>
                            )}
                            {v.is_offer && (() => {
                              const before = getBeforePriceForCurrency(v, activeCurrency);
                              if (before != null) {
                                return (
                                  <span className="text-xs line-through opacity-50 tabular-nums" style={{ color: P.muted }}>
                                    {formatCurrency(before, activeCurrency, locale)}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            <span className="text-base font-bold tabular-nums" style={{ color: v.is_offer ? P.accent : P.deep }}>
                              {formatCurrency(
                                activeCurrency === "TRY" ? (v.price_try ?? 0) : (v.price_syp ?? 0),
                                activeCurrency,
                                locale,
                              )}
                            </span>
                            {enableUsd && v.price_usd != null && (
                              <span className="text-xs tabular-nums" style={{ color: P.muted }}>
                                {" · "}{formatCurrency(v.price_usd, "USD", locale)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preload all variant images for instant switching */}
                <div className="hidden" aria-hidden="true">
                  {item.item_variants.map((v) =>
                    v.image_url ? (
                      <Image
                        key={v.id}
                        src={v.image_url}
                        alt=""
                        width={512}
                        height={512}
                        priority
                        unoptimized
                      />
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
