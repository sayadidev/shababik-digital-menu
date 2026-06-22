"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { HomeIcon, CategoriesIcon, ItemsIcon, AnalyticsIcon, PlusIcon } from "./icons";

const links = [
  { href: "/admin", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: HomeIcon },
  { href: "/admin/categories", labelEn: "Categories", labelAr: "الأقسام", icon: CategoriesIcon },
];

const linksRight = [
  { href: "/admin/items", labelEn: "Items", labelAr: "الأصناف", icon: ItemsIcon },
  { href: "/admin/analytics", labelEn: "Analytics", labelAr: "الإحصائيات", icon: AnalyticsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-border px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] flex items-start transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ borderRadius: "1.25rem 1.25rem 0 0", boxShadow: "0 -4px 24px rgba(0,0,0,0.04)" }}
    >
      {links.map(({ href, labelEn, labelAr, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors relative ${
              active ? "text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t(labelEn, labelAr)}</span>
            {active && <span className="absolute -top-2 w-5 h-0.5 bg-primary rounded-full" />}
          </Link>
        );
      })}

      <Link
        href="/admin/items/new"
        className="relative -top-3 w-13 h-13 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0"
        style={{ boxShadow: "0 4px 16px rgba(184, 122, 74, 0.35)" }}
        title={t("New Item", "صنف جديد")}
      >
        <PlusIcon className="w-6 h-6" />
      </Link>

      {linksRight.map(({ href, labelEn, labelAr, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors relative ${
              active ? "text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t(labelEn, labelAr)}</span>
            {active && <span className="absolute -top-2 w-5 h-0.5 bg-primary rounded-full" />}
          </Link>
        );
      })}
    </nav>
  );
}
