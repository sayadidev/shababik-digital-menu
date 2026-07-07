"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ItemWithVariants } from "@/lib/menu";
import { formatSyp } from "@/lib/format-currency";

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
      className="flex gap-4 bg-white p-3 mb-4 rounded-2xl shadow-sm border border-[#E8E6E1] active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={name}
            width={96}
            height={96}
            className="w-24 h-24 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex w-24 h-24 items-center justify-center rounded-xl bg-[#F5F0E6]">
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

      <div className="flex flex-col flex-1 min-w-0">
        {item.is_bestseller && (
          <span className="inline-block self-start rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-semibold text-white mb-1.5">
            {t("bestseller")}
          </span>
        )}

        <h3 className="text-base font-bold text-gray-900">{name}</h3>
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-1 mb-2">
            {description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-auto">
          {item.item_variants.map((v) => {
            const sizeName =
              locale === "ar" ? v.size_name_ar : v.size_name_en;
            return (
              <div
                key={v.id}
                className="bg-[#FDFBF7] border border-[#E8E6E1] text-[#5A4A3A] px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              >
                {item.item_variants.length > 1 && sizeName && (
                  <span>{sizeName}</span>
                )}
                <span className="tabular-nums font-bold">
                  ${v.price_usd.toFixed(2)}
                </span>
                <span className="tabular-nums text-xs opacity-60">
                  {formatSyp(v.price_syp, locale)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <span className="sr-only">
        {locale === "ar" ? "اضغط للتفاصيل" : "Tap for details"}
      </span>
    </article>
  );
}
