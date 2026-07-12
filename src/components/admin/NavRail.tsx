"use client";

import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { HomeIcon, CategoriesIcon, ItemsIcon, AnalyticsIcon, SettingsIcon, OrdersIcon, TablesIcon } from "./icons";
import type { UserRole } from "@/lib/role-utils";

export default function NavRail({ headerLogoUrl, role, isPro }: { headerLogoUrl: string; role: UserRole | null; isPro: boolean }) {
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const isStaff = role === "staff";

  const allLinks = [
    { href: "/admin", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: HomeIcon },
    { href: "/admin/categories", labelEn: "Categories", labelAr: "الأقسام", icon: CategoriesIcon },
    { href: "/admin/items", labelEn: "Items", labelAr: "الأصناف", icon: ItemsIcon },
    { href: "/admin/tables", labelEn: "Tables", labelAr: "الطاولات", icon: TablesIcon, proOnly: true },
    { href: "/admin/analytics", labelEn: "Analytics", labelAr: "الإحصائيات", icon: AnalyticsIcon },
    { href: "/admin/orders", labelEn: "Orders", labelAr: "الطلبات", icon: OrdersIcon, proOnly: true },
    { href: "/admin/settings", labelEn: "Settings", labelAr: "الإعدادات", icon: SettingsIcon },
  ];

  const links = isStaff
    ? allLinks.filter((l) => l.href === "/admin/orders" || l.href === "/admin" || l.href === "/admin/tables")
    : allLinks;

  return (
    <aside className="hidden md:flex fixed left-0 rtl:right-0 rtl:left-auto top-0 bottom-0 z-40 flex-col items-start py-6 gap-6 bg-surface/70 backdrop-blur-xl border-r rtl:border-l rtl:border-r-0 border-border w-60">
      <Link href="/admin" className="shrink-0 w-full flex justify-center">
        <img src={headerLogoUrl} alt="Shababik" className="w-32 h-auto object-contain" />
      </Link>
      <nav className="flex flex-col items-stretch gap-1 flex-1 w-full px-3">
        {links.map(({ href, labelEn, labelAr, icon: Icon, proOnly }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted hover:text-foreground hover:bg-primary/10"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{t(labelEn, labelAr)}</span>
              {proOnly && !isPro && (
                <span className="text-[10px] opacity-40 shrink-0">🔒</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="py-2" />
    </aside>
  );
}
