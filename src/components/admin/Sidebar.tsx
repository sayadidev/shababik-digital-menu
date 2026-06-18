"use client";

import { useState } from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const navItems = [
  { href: "/admin", labelKey: "dashboard" },
  { href: "/admin/categories", labelKey: "categories" },
  { href: "/admin/items", labelKey: "items" },
] as const;

export default function Sidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost drawer-button fixed top-4 start-4 z-50 md:hidden"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 border-e border-border bg-base-100 transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-lg font-bold text-base-content">Shababik</span>
        </div>

        <nav className="p-4">
          <ul className="menu rounded-box gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={isActive(item.href) ? "active bg-brand-light text-brand-deep font-medium" : "text-muted"}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
