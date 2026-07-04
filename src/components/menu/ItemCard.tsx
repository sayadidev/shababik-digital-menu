"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ItemWithVariants } from "@/lib/menu";

type Props = {
  item: ItemWithVariants;
  onSelect: (item: ItemWithVariants) => void;
};

export default function ItemCard({ item, onSelect }: Props) {
  const locale = useLocale();
  const t = useTranslations("common");

  const name = locale === "ar" ? item.name_ar : item.name_en;
  const description =
    locale === "ar" ? item.description_ar : item.description_en;

  return (
    <article
      onClick={() => onSelect(item)}
      className="relative cursor-pointer rounded-2xl border border-black/5 bg-white shadow-sm ring-1 ring-transparent transition-all duration-150 active:scale-[0.98] hover:shadow-md hover:ring-black/[0.03]"
    >
      {item.is_bestseller && (
        <div className="absolute -top-2.5 left-4 z-10 rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow-sm rtl:right-4 rtl:left-auto">
          {t("bestseller")}
        </div>
      )}

      <div className="flex gap-4 p-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={name}
              fill
              sizes="96px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#F5F0E6]">
              <svg
                className="h-8 w-8 text-[#9a6a3a]/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="text-base font-bold text-gray-900 sm:text-lg">
            {name}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {description}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.item_variants.map((v) => {
              const sizeName =
                locale === "ar" ? v.size_name_ar : v.size_name_en;
              return (
                <div
                  key={v.id}
                  className="inline-flex flex-col rounded-lg bg-[#F5F0E6] px-3 py-1.5"
                >
                  <span className="flex items-baseline gap-1">
                    {item.item_variants.length > 1 && sizeName && (
                      <span className="text-xs font-medium text-[#5A4A3A]">
                        {sizeName}
                      </span>
                    )}
                    <span className="text-sm font-bold tabular-nums text-[#5A4A3A]">
                      ${v.price_usd.toFixed(2)}
                    </span>
                  </span>
                  <span className="text-[11px] tabular-nums text-[#8A7A6A]">
                    {v.price_syp.toLocaleString()} {t("syp")}
                  </span>
                </div>
              );
            })}
          </div>

          <span className="sr-only">
            {locale === "ar" ? "اضغط للتسجيل" : "Tap to record view"}
          </span>
        </div>
      </div>
    </article>
  );
}
