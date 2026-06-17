"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { trackEvent } from "@/lib/actions/analytics";
import LanguageToggle from "./LanguageToggle";
import CategorySection from "./CategorySection";
import type { MenuData } from "@/lib/menu";

type Props = {
  data: MenuData;
};

export default function MenuView({ data }: Props) {
  const locale = useLocale();
  const [activeCatId, setActiveCatId] = useState<string | null>(
    data.categories[0]?.id ?? null,
  );
  const [loaded, setLoaded] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Track menu_load once on mount
  useEffect(() => {
    trackEvent("menu_load").catch(() => {});
    // Small delay for animation
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer to highlight active category pill
  const observeSections = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const id = node.dataset.categoryId;
    if (id) {
      sectionRefs.current.set(id, node);
    }
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
      { rootMargin: "-90px 0px -60% 0px", threshold: 0 },
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

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-[#faf8f5]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              {cafeName}
            </h1>
            <p className="text-[10px] font-medium text-amber-700 sm:text-xs">
              {locale === "ar" ? "كافيه" : "Cafe"}
            </p>
          </div>
          <LanguageToggle />
        </div>

        {/* Category pills — horizontally scrollable */}
        <nav className="overflow-x-auto border-t border-amber-100/50 px-4 py-2">
          <div className="flex gap-2">
            {data.categories.map((cat) => {
              const name = locale === "ar" ? cat.name_ar : cat.name_en;
              const isActive = activeCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-700 text-white shadow-sm"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Menu sections */}
      <main
        className={`px-4 py-6 transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {data.categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-4xl">
              <svg className="mx-auto h-12 w-12 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-500">
              {locale === "ar"
                ? "القائمة قيد الإعداد"
                : "Menu coming soon"}
            </p>
          </div>
        ) : (
          data.categories.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              sectionRef={observeSections}
            />
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 bg-white px-4 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Shababik Cafe
      </footer>
    </div>
  );
}
