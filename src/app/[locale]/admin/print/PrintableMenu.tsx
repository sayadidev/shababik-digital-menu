"use client";

import { useEffect, useState } from "react";
import type { MenuData } from "@/lib/menu";

type Props = {
  data: MenuData;
  locale: string;
};

export default function PrintableMenu({ data, locale }: Props) {
  const [ready, setReady] = useState(false);
  const isRtl = locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const settings = data.settings;
  const enableUsd = settings?.enable_usd ?? true;
  const logoUrl = settings?.hero_logo_url || settings?.header_logo_url || "/wooden-trans-logo.webp";

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
          margin: 14mm 12mm;
        }

        @media print {
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            background-color: #FDFBF7 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            padding: 0 !important;
            max-width: none !important;
          }
          .print-item {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-category {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-item img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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

      <div dir={dir} className="min-h-screen" style={{ backgroundColor: "#FDFBF7", fontFamily: "var(--font-sans)" }}>
        {/* Screen-only header bar */}
        <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: "rgba(253,251,247,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #d4c4b0" }}>
          <span className="text-sm font-semibold" style={{ color: "#3B2818" }}>
            {t("Printable Menu", "قائمة الطعام القابلة للطباعة")}
          </span>
          <span className="text-xs" style={{ color: "#8a7a6a" }}>
            {ready
              ? t("Save as PDF from your browser's print dialog", "احفظ كـ PDF من نافذة الطباعة")
              : t("Preparing...", "جاري التحضير...")}
          </span>
        </div>

        <div className="print-page" style={{ paddingTop: "48px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <img
              src={logoUrl}
              alt="Shababik"
              style={{
                maxWidth: "180px",
                maxHeight: "80px",
                objectFit: "contain",
                display: "inline-block",
              }}
            />
          </div>

          {/* Menu Title */}
          <h1 style={{
            textAlign: "center",
            fontSize: "18px",
            fontWeight: 700,
            color: "#3B2818",
            marginBottom: "32px",
            letterSpacing: "0.05em",
            fontFamily: "var(--font-sans)",
          }}>
            {t("Our Menu", "قائمتنا")}
          </h1>

          {/* Categories and Items */}
          {data.categories.map((category) => (
            <div key={category.id} className="print-category" style={{ marginBottom: "28px" }}>
              {/* Category Header */}
              <div style={{
                borderBottom: "2px solid #D4B895",
                paddingBottom: "6px",
                marginBottom: "14px",
                position: "relative" as const,
              }}>
                <h2 style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#3B2818",
                  margin: 0,
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.03em",
                }}>
                  {locale === "ar" ? category.name_ar : category.name_en}
                </h2>
                <div style={{
                  position: "absolute",
                  bottom: "-2px",
                  [isRtl ? "right" : "left"]: 0,
                  width: "48px",
                  height: "2px",
                  backgroundColor: "#B8743A",
                }} />
              </div>

              {/* 2-Column Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 18px",
              }}>
                {category.items.map((item) => {
                  const name = locale === "ar" ? item.name_ar : item.name_en;
                  const description = locale === "ar" ? item.description_ar : item.description_en;

                  // Get the price display for all variants
                  const priceDisplay = item.item_variants
                    .map((v) => {
                      const sizeName = item.item_variants.length > 1
                        ? (locale === "ar" ? v.size_name_ar : v.size_name_en) + " "
                        : "";
                      if (enableUsd) {
                        return `${sizeName}$${v.price_usd.toFixed(2)} · ${v.price_syp.toLocaleString()} SYP`;
                      }
                      return `${sizeName}${v.price_syp.toLocaleString()} SYP`;
                    })
                    .join("  ");

                  return (
                    <div
                      key={item.id}
                      className="print-item"
                      style={{
                        display: "flex",
                        gap: "10px",
                        padding: "6px 0",
                        alignItems: "flex-start",
                      }}
                    >
                      {/* Thumbnail */}
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={name}
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "8px",
                          backgroundColor: "#F4F0EA",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <span style={{ fontSize: "10px", color: "#b5a594" }}>
                            {t("No img", "بدون صورة")}
                          </span>
                        </div>
                      )}

                      {/* Item Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                          <h3 style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#3B2818",
                            margin: 0,
                            lineHeight: 1.3,
                            fontFamily: "var(--font-sans)",
                          }}>
                            {name}
                          </h3>
                          {item.is_bestseller && (
                            <span style={{
                              fontSize: "8px",
                              fontWeight: 600,
                              color: "#B8743A",
                              backgroundColor: "#FDF0E0",
                              padding: "1px 5px",
                              borderRadius: "3px",
                              whiteSpace: "nowrap",
                              lineHeight: 1.6,
                            }}>
                              {t("BESTSELLER", "الأكثر طلباً")}
                            </span>
                          )}
                        </div>

                        {description && (
                          <p style={{
                            fontSize: "10px",
                            color: "#8a7a6a",
                            margin: "0 0 4px 0",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          } as React.CSSProperties}>
                            {description}
                          </p>
                        )}

                        <div style={{
                          fontSize: "11px",
                          color: "#5a4a3a",
                          fontWeight: 600,
                          lineHeight: 1.4,
                          fontFamily: "var(--font-sans)",
                        }}>
                          {priceDisplay}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div style={{
            textAlign: "center",
            marginTop: "32px",
            paddingTop: "16px",
            borderTop: "1px solid #d4c4b0",
          }}>
            <p style={{ fontSize: "10px", color: "#8a7a6a", margin: 0 }}>
              Shababik &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
