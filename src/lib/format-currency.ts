import type { Currency, DisplayCurrency } from "@/types/database";

/**
 * Formats a price with the appropriate currency label per locale.
 *
 *   TRY → "150 TL"        (Turkish Lira)
 *   USD → "$4.99"         (US Dollar)
 *   SYP → ar "1,500 ل.س"  /  en "1,500 SYP"
 */
export function formatCurrency(
  price: number,
  currency: DisplayCurrency,
  locale: string,
): string {
  switch (currency) {
    case "TRY": {
      const formatted = price.toLocaleString(
        locale === "ar" ? "ar" : "en-US",
        { minimumFractionDigits: 0, maximumFractionDigits: 2 },
      );
      return `${formatted} TL`;
    }
    case "USD": {
      return `$${price.toFixed(2)}`;
    }
    case "SYP": {
      const num = price.toLocaleString();
      return locale === "ar" ? `${num} ل.س` : `${num} SYP`;
    }
  }
}

/**
 * Returns the price from a variant for the given local currency, falling back to 0.
 * Only accepts TRY or SYP — USD is a secondary display toggle, not a base currency.
 */
export function getPriceForCurrency(
  variant: { price_usd: number | null; price_syp: number | null; price_try: number | null },
  currency: Currency,
): number {
  return currency === "TRY" ? (variant.price_try ?? 0) : (variant.price_syp ?? 0);
}

/**
 * Returns the sale before-price from a variant for the given currency, falling back to null.
 */
export function getBeforePriceForCurrency(
  variant: { price_before_usd: number | null; price_before_syp: number | null; price_before_try: number | null },
  currency: Currency,
): number | null {
  if (currency === "TRY") return variant.price_before_try;
  return variant.price_before_syp;
}

/**
 * @deprecated Use `formatCurrency(price, "SYP", locale)` instead.
 */
export function formatSyp(priceSyp: number, locale: string): string {
  const num = priceSyp.toLocaleString();
  return locale === "ar" ? `${num} ل.س` : `${num} SYP`;
}
