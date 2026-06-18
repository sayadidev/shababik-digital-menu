"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { trackEvent } from "@/lib/actions/analytics";
import LanguageToggle from "./LanguageToggle";
import CategorySection from "./CategorySection";
import ItemDetailSheet from "./ItemDetailSheet";
import type { MenuData, ItemWithVariants } from "@/lib/menu";

type Props = {
  data: MenuData;
};

export default function MenuView({ data }: Props) {
  const locale = useLocale();
  const [activeCatId, setActiveCatId] = useState<string | null>(
    data.categories[0]?.id ?? null,
  );
  const [loaded, setLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithVariants | null>(
    null,
  );
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent("menu_load").catch(() => {});
    const timer = setTimeout(() => setLoaded(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const observeSections = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const id = node.dataset.categoryId;
    if (id) sectionRefs.current.set(id, node);
  }, []);

  useEffect(() => {
    if (data.categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.categoryId;
            if (id) setActiveCatId(id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 },
    );
    for (const ref of sectionRefs.current.values()) {
      observer.observe(ref);
    }
    return () => observer.disconnect();
  }, [data.categories]);

  const scrollToCategory = (id: string) => {
    const el = sectionRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cafeName = locale === "ar" ? "شَبَابِيك" : "Shababik";
  const tagline = locale === "ar" ? "كافيه" : "Cafe";
  const isRtl = locale === "ar";

  return (
    <div className="mx-auto min-h-screen max-w-2xl menu-page-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {cafeName}
            </h1>
            <span className="hidden text-xs font-medium text-muted sm:inline">
              {tagline}
            </span>
          </div>
          <LanguageToggle />
        </div>

        <nav
          ref={navRef}
          className="scrollbar-hide overflow-x-auto border-t border-border px-5 py-2.5"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div
            className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}
            style={{ scrollSnapType: "x mandatory" }}
          >
            {data.categories.map((cat) => {
              const name = locale === "ar" ? cat.name_ar : cat.name_en;
              const isActive = activeCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  style={{ scrollSnapAlign: isRtl ? "end" : "start" }}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-brand-deep text-white shadow-sm"
                      : "bg-brand-light/60 text-muted hover:bg-brand-light hover:text-foreground"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main
        className={`px-5 py-7 transition-all duration-500 ease-out ${
          loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {data.categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 rounded-full bg-brand-light p-4">
              <svg
                className="h-8 w-8 text-brand-deep"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-muted">
              {locale === "ar" ? "القائمة قيد الإعداد" : "Menu coming soon"}
            </p>
          </div>
        ) : (
          data.categories.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              sectionRef={observeSections}
              onSelectItem={setSelectedItem}
            />
          ))
        )}
      </main>

      <footer className="border-t border-border bg-surface px-5 py-5 text-center">
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} Shababik Cafe
        </p>
      </footer>

      <ItemDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
