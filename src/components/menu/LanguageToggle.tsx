"use client";

import { Suspense } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";

function LanguageToggleInner() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const other = locale === "en" ? "ar" : "en";

  const queryString = searchParams.toString();
  const href = queryString ? `${pathname}?${queryString}` : pathname;

  return (
    <Link
      href={href}
      locale={other}
      className="btn btn-outline btn-sm rounded-full border-border"
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

export default function LanguageToggle() {
  return (
    <Suspense>
      <LanguageToggleInner />
    </Suspense>
  );
}
