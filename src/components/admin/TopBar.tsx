"use client";

import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { GlobeIcon } from "./icons";

const pageTitles: Record<string, { en: string; ar: string }> = {
  "/admin": { en: "Dashboard", ar: "لوحة التحكم" },
  "/admin/categories": { en: "Categories", ar: "الأقسام" },
  "/admin/items": { en: "Items", ar: "الأصناف" },
  "/admin/items/new": { en: "New Item", ar: "صنف جديد" },
  "/admin/analytics": { en: "Analytics", ar: "الإحصائيات" },
  "/admin/orders": { en: "Orders", ar: "الطلبات" },
};

export default function TopBar({ headerLogoUrl }: { headerLogoUrl: string }) {
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";

  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || (key !== "/admin" && pathname.startsWith(key))
  )?.[1][locale as "en" | "ar"] || "Admin";

  const otherLocale = locale === "en" ? "ar" : "en";

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7] shadow-sm">
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" locale={locale} className="md:hidden shrink-0">
            <img src={headerLogoUrl} alt="S" className="h-8 w-28 object-contain object-right shrink-0" />
          </Link>
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted px-3 py-1.5 bg-primary/5 rounded-full">
            {today}
          </span>
          <Link
            href={pathname}
            locale={otherLocale}
            className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium hover:bg-primary/20 transition-all"
            title={`Switch to ${otherLocale === "ar" ? "Arabic" : "English"}`}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
