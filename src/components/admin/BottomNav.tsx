"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { HomeIcon, CategoriesIcon, ItemsIcon, PlusIcon, SettingsIcon, OrdersIcon } from "./icons";
import type { UserRole } from "@/lib/role-utils";

const allLinks = [
  { href: "/admin", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: HomeIcon },
  { href: "/admin/categories", labelEn: "Categories", labelAr: "الأقسام", icon: CategoriesIcon },
  { href: "/admin/items", labelEn: "Items", labelAr: "الأصناف", icon: ItemsIcon },
  { href: "/admin/orders", labelEn: "Orders", labelAr: "الطلبات", icon: OrdersIcon },
  { href: "/admin/settings", labelEn: "Settings", labelAr: "الإعدادات", icon: SettingsIcon },
];

export default function BottomNav({ role }: { role: UserRole | null }) {
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isStaff = role === "staff";
  const links = isStaff
    ? allLinks.filter((l) => l.href === "/admin/orders" || l.href === "/admin")
    : allLinks;

  // Hide FAB on item create/edit routes
  const isItemForm = pathname.endsWith("/new") || pathname.includes("/edit");

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(href));

  if (isItemForm) return null;

  return (
    <>
      {/* ── Floating Action Button ───────────────── */}
      {!isStaff && (
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className={`md:hidden fixed right-4 z-50 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 ${
            visible ? "bottom-[84px] opacity-100 translate-y-0" : "bottom-2 opacity-0 translate-y-4 pointer-events-none"
          }`}
        style={{
          boxShadow: "0 4px 18px rgba(154, 106, 58, 0.35)",
          transition: "bottom 0.3s ease-out, opacity 0.3s ease-out, transform 0.3s ease-out",
        }}
        aria-label={t("New", "جديد")}
      >
            <PlusIcon className="w-6 h-6" />
          </button>
        )}

      {/* ── Bottom Nav ────────────────────────────── */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center w-full px-1 py-2 pb-[max(8px,env(safe-area-inset-bottom))] transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          backgroundColor: "rgba(255,252,248,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid #dcc8b4",
          borderRadius: "1.25rem 1.25rem 0 0",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.04)",
        }}
      >
        {links.map(({ href, labelEn, labelAr, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] py-1"
            style={{ color: isActive(href) ? "#9a6a3a" : "#8a7a6a" }}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold whitespace-nowrap leading-none">
              {t(labelEn, labelAr)}
            </span>
          </Link>
        ))}
      </nav>

      {/* ── Animated Add Menu ──────────────────── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50" ref={menuRef} onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            style={{ animation: "fadeIn 0.2s ease-out" }} />

          <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(24px,env(safe-area-inset-bottom))]"
            style={{ animation: "slideUp 0.35s cubic-bezier(0.32,0.72,0,1)" }}>
            <div className="bg-surface rounded-2xl shadow-2xl overflow-hidden">
              <Link href="/admin/items/new" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-primary/5 active:bg-primary/10 transition-all border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("New Item", "صنف جديد")}</p>
                  <p className="text-xs text-muted">{t("Add a new menu item with sizes and prices", "إضافة صنف جديد مع المقاسات والأسعار")}</p>
                </div>
              </Link>
              <Link href="/admin/categories" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-primary/5 active:bg-primary/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("New Category", "قسم جديد")}</p>
                  <p className="text-xs text-muted">{t("Create a new category to organize items", "إنشاء قسم جديد لتنظيم الأصناف")}</p>
                </div>
              </Link>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)}
              className="w-full mt-3 py-3.5 rounded-2xl bg-surface text-foreground text-sm font-semibold shadow-lg active:scale-[0.98] transition-all">
              {t("Cancel", "إلغاء")}
            </button>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>
        </div>
      )}
    </>
  );
}
