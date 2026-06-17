"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/actions/analytics";
import type { ItemWithVariants } from "@/lib/menu";

type Props = {
  item: ItemWithVariants;
};

export default function ItemCard({ item }: Props) {
  const locale = useLocale();
  const t = useTranslations("common");

  const name = locale === "ar" ? item.name_ar : item.name_en;
  const description =
    locale === "ar" ? item.description_ar : item.description_en;

  const handleTap = () => {
    trackEvent("item_tap", item.id).catch(() => {});
  };

  return (
    <article
      onClick={handleTap}
      className="group relative flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
    >
      {/* Bestseller badge */}
      {item.is_bestseller && (
        <div className="absolute -top-2 start-4 z-10 rounded-full bg-amber-700 px-3 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          {t("bestseller")}
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={name}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-amber-50 text-2xl">
            <svg className="h-8 w-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 sm:text-sm">
            {description}
          </p>
        )}

        {/* Variants / Prices */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {item.item_variants.map((v) => {
            const sizeName = locale === "ar" ? v.size_name_ar : v.size_name_en;
            return (
              <div
                key={v.id}
                className="inline-flex items-baseline gap-1.5 rounded-md bg-amber-50/60 px-2 py-0.5 text-xs"
              >
                {item.item_variants.length > 1 && sizeName && (
                  <span className="font-medium text-gray-600">{sizeName}</span>
                )}
                <span className="font-semibold text-gray-900">
                  ${v.price_usd.toFixed(2)}
                </span>
                <span className="text-gray-400">/</span>
                <span className="font-medium text-gray-500">
                  {v.price_syp.toLocaleString()} {t("syp")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Screen-reader hint for analytics tap tracking */}
        <span className="sr-only">
          {locale === "ar" ? "اضغط للتسجيل" : "Tap to record view"}
        </span>
      </div>
    </article>
  );
}
