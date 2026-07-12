"use client";

import { useEffect, useState } from "react";
import type { MenuData } from "@/lib/menu";
import { formatCurrency } from "@/lib/format-currency";
import type { Currency } from "@/types/database";

type Props = {
  data: MenuData;
  locale: string;
};

const FallbackIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c4b49c" }}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

export default function PrintableMenu({ data, locale }: Props) {
  const [ready, setReady] = useState(false);
  const isRtl = locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const settings = data.settings;
  const activeCurrency: Currency = settings?.active_currency ?? "TRY";
  const enableUsd = settings?.enable_usd ?? true;
  const logoUrl =
    settings?.hero_logo_url ||
    settings?.header_logo_url ||
    "/wooden-trans-logo.webp";

  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 0 !important;
        }

        @media print {
          html, body, .print-root {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background-color: #FDFBF7 !important;
          }
          .print-root {
            background-color: #FDFBF7 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            padding: 0 !important;
            max-width: none !important;
            box-shadow: none !important;
          }
          .print-item {
            break-inside: avoid !important;
            break-inside: avoid-column !important;
            page-break-inside: avoid !important;
          }
          .print-category {
            break-inside: avoid !important;
            break-inside: avoid-column !important;
            page-break-inside: avoid !important;
          }
          .print-item img,
          .print-item svg {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }

        @media screen {
          .print-page {
            max-width: 210mm;
            margin: 0 auto;
            padding: 14mm 12mm;
            background: #FDFBF7;
            box-shadow: 0 0 30px rgba(0,0,0,0.08);
          }
        }
      `}</style>

      <div
        dir={dir}
        className="print-root min-h-screen w-full p-12"
        style={{
          backgroundColor: "#FDFBF7",
          fontFamily: "var(--font-sans)",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      >
        {/* Screen-only header bar */}
        <div
          className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
          style={{
            backgroundColor: "rgba(253,251,247,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #d4c4b0",
          }}
        >
          <span className="text-sm font-semibold" style={{ color: "#3B2818" }}>
            {t("Printable Menu", "قائمة الطعام القابلة للطباعة")}
          </span>
          <span className="text-xs" style={{ color: "#8a7a6a" }}>
            {ready
              ? t(
                  "Save as PDF from your browser's print dialog",
                  "احفظ كـ PDF من نافذة الطباعة"
                )
              : t("Preparing...", "جاري التحضير...")}
          </span>
        </div>

        <div className="print-page" style={{ paddingTop: "48px" }}>
          {/* Logo */}
          <div className="text-center mb-7">
            <img
              src={logoUrl}
              alt="Shababik"
              className="inline-block"
              style={{
                maxWidth: "180px",
                maxHeight: "80px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Menu Title */}
          <h1
            className="text-center text-lg font-bold mb-8 tracking-wider"
            style={{
              color: "#3B2818",
              fontFamily: "var(--font-sans)",
            }}
          >
            {t("Our Menu", "قائمتنا")}
          </h1>

          {/* ── CSS Columns layout for categories & items ── */}
          <div className="columns-2 gap-6 print:columns-2 print:gap-6 w-full max-w-[210mm] mx-auto">
            {data.categories.map((category) => (
              <div
                key={category.id}
                className="print-category break-inside-avoid print:break-inside-avoid mb-8"
              >
                {/* Category Header */}
                <div
                  className="border-b-2 pb-1.5 mb-3 relative"
                  style={{ borderColor: "#D4B895" }}
                >
                  <h2
                    className="text-sm font-bold tracking-wide m-0"
                    style={{
                      color: "#3B2818",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {locale === "ar" ? category.name_ar : category.name_en}
                  </h2>
                  <div
                    className="absolute w-12"
                    style={{
                      bottom: "-2px",
                      height: "2px",
                      backgroundColor: "#B8743A",
                      [isRtl ? "right" : "left"]: 0,
                    }}
                  />
                </div>

                {/* Items */}
                {category.items.map((item) => {
                  const name =
                    locale === "ar" ? item.name_ar : item.name_en;
                  const description =
                    locale === "ar"
                      ? item.description_ar
                      : item.description_en;

                  return (
                    <div
                      key={item.id}
                      className="print-item break-inside-avoid print:break-inside-avoid flex gap-3 py-2"
                    >
                      {/* Thumbnail or fallback */}
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={name}
                          className="w-24 h-24 rounded-xl object-cover shrink-0"
                          style={{
                            width: "96px",
                            height: "96px",
                            borderRadius: "12px",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          className="shrink-0 rounded-xl flex items-center justify-center"
                          style={{
                            width: "96px",
                            height: "96px",
                            backgroundColor: "#F4F0EA",
                            borderRadius: "12px",
                            flexShrink: 0,
                          }}
                        >
                          <FallbackIcon />
                        </div>
                      )}

                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="text-xs font-bold m-0 leading-tight"
                            style={{
                              color: "#3B2818",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {name}
                          </h3>
                          {item.is_bestseller && (
                            <span
                              className="text-[9px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded"
                              style={{
                                color: "#B8743A",
                                backgroundColor: "#FDF0E0",
                              }}
                            >
                              {t("BESTSELLER", "الأكثر طلباً")}
                            </span>
                          )}
                        </div>

                        {description && (
                          <p
                            className="text-[10px] mt-0.5 line-clamp-2"
                            style={{
                              color: "#8a7a6a",
                              lineHeight: "1.4",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            } as React.CSSProperties}
                          >
                            {description}
                          </p>
                        )}

                        {/* Prices */}
                        <div
                          className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1"
                          style={{
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {item.item_variants.map((v, idx) => {
                            const sizeName =
                              item.item_variants.length > 1
                                ? locale === "ar"
                                  ? v.size_name_ar
                                  : v.size_name_en
                                : null;

                            const localPrice = formatCurrency(
                              activeCurrency === "TRY" ? (v.price_try ?? 0) : (v.price_syp ?? 0),
                              activeCurrency,
                              locale,
                            );
                            const usdStr = enableUsd && v.price_usd != null
                              ? ` · ${formatCurrency(v.price_usd, "USD", locale)}`
                              : "";
                            const priceText = `${localPrice}${usdStr}`;

                            return (
                              <span key={v.id} className="inline-flex items-baseline">
                                {sizeName && (
                                  <span
                                    className="text-xs"
                                    style={{ color: "#8a7a6a" }}
                                  >
                                    {sizeName}:&nbsp;
                                  </span>
                                )}
                                <span
                                  className="text-sm font-extrabold tracking-tight tabular-nums"
                                  style={{ color: "#8C6B4A" }}
                                >
                                  {priceText}
                                </span>
                                {idx < item.item_variants.length - 1 && (
                                  <span
                                    className="mx-1.5 text-xs"
                                    style={{ color: "#d4c4b0" }}
                                  >
                                    |
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="text-center mt-8 pt-4 border-t w-full max-w-[210mm] mx-auto"
            style={{ borderColor: "#d4c4b0" }}
          >
            <p style={{ fontSize: "10px", color: "#8a7a6a", margin: 0 }}>
              Shababik &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
