"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "en" ? "ar" : "en";

  return (
    <Link
      href={pathname}
      locale={other}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted shadow-xs transition-all hover:border-brand/30 hover:text-foreground active:scale-95"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m0 4V9m0 4v2m0 4v2M5 3l14 14m0 0v-4m0 4h-4"
        />
      </svg>
      <span>{other === "ar" ? "العربية" : "English"}</span>
    </Link>
  );
}
