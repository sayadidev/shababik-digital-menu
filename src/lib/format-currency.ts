/**
 * Formats a SYP price with the appropriate currency label per locale.
 * - ar → "1,500 ل.س"
 * - en → "1,500 SYP"
 */
export function formatSyp(priceSyp: number, locale: string): string {
  const num = priceSyp.toLocaleString();
  return locale === "ar" ? `${num} ل.س` : `${num} SYP`;
}
