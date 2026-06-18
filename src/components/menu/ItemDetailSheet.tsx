"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/actions/analytics";
import type { ItemWithVariants } from "@/lib/menu";

type Props = {
  item: ItemWithVariants | null;
  onClose: () => void;
};

export default function ItemDetailSheet({ item, onClose }: Props) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [imageIndex, setImageIndex] = useState(0);
  const [visible, setVisible] = useState(false);

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
    trackEvent("item_tap", item.id).catch(() => {});
    requestAnimationFrame(() => setVisible(true));
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
      className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-200 ${
        visible ? "bg-black/50" : "bg-transparent"
      }`}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      tabIndex={-1}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg transform rounded-t-2xl bg-surface shadow-xl transition-all duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="absolute end-4 top-4 z-10">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-circle btn-ghost btn-sm bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 border-0"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-brand-light/30">
          {allImages.length > 0 ? (
            <>
              <Image
                src={allImages[imageIndex]}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover transition-opacity duration-300"
                priority
              />
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) =>
                        i === 0 ? allImages.length - 1 : i - 1,
                      )
                    }
                    className={`btn btn-circle btn-ghost btn-sm absolute top-1/2 -translate-y-1/2 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 border-0 ${
                      isRtl ? "end-3" : "start-3"
                    }`}
                    aria-label="Previous image"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`btn btn-circle btn-ghost btn-sm absolute top-1/2 -translate-y-1/2 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 border-0 ${
                      isRtl ? "start-3" : "end-3"
                    }`}
                    aria-label="Next image"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                    </svg>
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === imageIndex
                            ? "w-6 bg-white"
                            : "w-2 bg-white/50 hover:bg-white/70"
                        }`}
                        aria-label={`Image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-16 w-16 text-brand/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4" dir={isRtl ? "rtl" : "ltr"}>
          {item.is_bestseller && (
            <span className="badge badge-secondary border-0 mb-2">
              {t("bestseller")}
            </span>
          )}

          <h2 className="text-xl font-bold text-foreground">{name}</h2>

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}

          <div className="mt-5 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {locale === "ar" ? "الأسعار" : "Pricing"}
            </h3>
            {item.item_variants.map((v) => {
              const sizeName =
                locale === "ar" ? v.size_name_ar : v.size_name_en;
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <span className="text-sm font-medium text-foreground">
                    {sizeName}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold tabular-nums text-foreground">
                      ${v.price_usd.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted">/</span>
                    <span className="text-sm font-medium tabular-nums text-muted">
                      {v.price_syp.toLocaleString()} {t("syp")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-outline mt-6 w-full rounded-xl"
          >
            {locale === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
