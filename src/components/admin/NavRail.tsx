"use client";

import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { HomeIcon, CategoriesIcon, ItemsIcon, AnalyticsIcon } from "./icons";

export default function NavRail() {
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const links = [
    { href: "/admin", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: HomeIcon },
    { href: "/admin/categories", labelEn: "Categories", labelAr: "الأقسام", icon: CategoriesIcon },
    { href: "/admin/items", labelEn: "Items", labelAr: "الأصناف", icon: ItemsIcon },
    { href: "/admin/analytics", labelEn: "Analytics", labelAr: "الإحصائيات", icon: AnalyticsIcon },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 rtl:right-0 rtl:left-auto top-0 bottom-0 z-40 flex-col items-center py-6 gap-6 bg-surface/70 backdrop-blur-xl border-r rtl:border-l rtl:border-r-0 border-border" style={{ width: 72 }}>
      <Link href="/admin" className="shrink-0">
        <img src="/wooden-trans-logo.webp" alt="S" className="w-8 h-8 object-contain" />
      </Link>
      <nav className="flex flex-col items-center gap-5 flex-1">
        {links.map(({ href, labelEn, labelAr, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted hover:text-foreground hover:bg-primary/10"
              }`}
              title={t(labelEn, labelAr)}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
      <Link
        href="/admin/login"
        className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold hover:bg-primary/20 transition-all"
        title={t("Account", "الحساب")}
      >
        <img src="/wooden-trans-logo.webp" alt="S" className="w-6 h-6 object-contain" />
      </Link>
    </aside>
  );
}
