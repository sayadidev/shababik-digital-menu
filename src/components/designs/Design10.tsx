"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { trackEvent } from "@/lib/actions/analytics";
import ItemDetailSheet from "@/components/menu/ItemDetailSheet";
import type { MenuData, ItemWithVariants } from "@/lib/menu";

/* ── Design 10: Rose Petal ─────────────────
   Dark coffeehouse (#3B2818) + warm beige (#D4B895)
   + vivid rose (#C46A6A) accent. Soft & romantic.
────────────────────────────────────────────────── */

const P = {
  deep: "#3B2818",
  warm: "#D4B895",
  bg: "#f5efdf",
  surface: "#fffcf8",
  text: "#2c1a0e",
  muted: "#7a6a56",
  accent: "#C46A6A",
  border: "#dcc8b4",
  shadow: "rgba(196,106,106,0.12)",
};

function LangToggle({ locale }: { locale: string }) {
  const [mounted, setMounted] = useState(false);
  const [other, setOther] = useState(locale === "en" ? "ar" : "en");
  useEffect(() => { setMounted(true); }, []);
  const href = mounted ? `/${other}${typeof window !== "undefined" ? window.location.pathname.replace(/^\/(en|ar)/, "/") : "/"}` : "#";
  return (
    <a href={href}
      className="shrink-0 p-1.5 transition-all duration-200 rounded-md"
      style={{ color: P.deep }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${P.deep}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m0 4V9m0 4v2m0 4v2M5 3l14 14m0 0v-4m0 0h-4" />
      </svg>
    </a>
  );
}

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${P.warm}50` }}>
      <svg className="h-6 w-6" style={{ color: `${P.deep}40` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export default function Design10({ data }: { data: MenuData }) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [activeCatId, setActiveCatId] = useState<string | null>(data.categories[0]?.id ?? null);
  const [loaded, setLoaded] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithVariants | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [heroExited, setHeroExited] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tickingRef = useRef(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => { trackEvent("menu_load").catch(() => {}); setTimeout(() => setLoaded(true), 100); }, []);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const threshold = typeof window !== "undefined" ? window.innerHeight * 0.75 : 600;
    const onScroll = () => {
      if (!tickingRef.current) {
        requestAnimationFrame(() => {
          setShowHeader(window.scrollY > threshold);
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const observe = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const id = node.dataset.categoryId;
    if (id) sectionRefs.current.set(id, node);
  }, []);

  const captureButton = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    const id = node.dataset.catId;
    if (id) buttonRefs.current.set(id, node);
  }, []);

  useEffect(() => {
    if (!activeCatId) return;
    const btn = buttonRefs.current.get(activeCatId);
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeCatId]);

  useEffect(() => {
    if (data.categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).dataset.categoryId;
            if (id) setActiveCatId(id);
          }
        }
      },
      { rootMargin: "-64px 0px -60% 0px", threshold: 0 },
    );
    const sections = document.querySelectorAll("[data-category-id]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [data.categories]);

  const featuredItems = useMemo(() => {
    const allActive = data.categories.flatMap(c => c.items).filter(i => i.is_active);
    const positionMap = new Map<number, ItemWithVariants>();
    for (const item of allActive) {
      if (item.is_offer && item.offer_position != null && item.offer_position >= 1 && item.offer_position <= 3) {
        positionMap.set(item.offer_position, item);
      }
    }
    const result: ItemWithVariants[] = [];
    const added = new Set<string>();
    for (let pos = 1; pos <= 3; pos++) {
      const assigned = positionMap.get(pos);
      if (assigned) {
        result.push(assigned);
        added.add(assigned.id);
      } else {
        const fallback = allActive.find(i => !added.has(i.id));
        if (fallback) {
          result.push(fallback);
          added.add(fallback.id);
        }
      }
    }
    return result;
  }, [data.categories]);

  // Hero exit animation on scroll
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroExited(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = sectionRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      {/* ── Hero — logo + 3 featured glassy cards ── */}
      <section ref={heroRef}
        className="relative flex flex-col items-center overflow-hidden"
        style={{
          minHeight: "100dvh",
          backgroundColor: "#f5efdf",
          paddingTop: "25dvh",
        }}>
        <img
          src="/wooden-trans-logo.webp"
          alt="Shababik"
          className="transition-all duration-700 ease-out"
          style={{
            height: loaded ? "12rem" : "6rem",
            width: "auto",
            opacity: loaded ? 1 : 0,
            filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.06))",
          }}
        />
        {featuredItems.length > 0 && (
          <div
            className="flex items-center justify-center mt-8 sm:mt-12 w-full max-w-2xl mx-auto px-4 overflow-visible"
            style={{
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.7s ease-out",
            }}>
            {featuredItems.map((item, i) => {
              const name = locale === "ar" ? item.name_ar : item.name_en;
              const desc = locale === "ar" ? item.description_ar : item.description_en;
              const isCenter = i === 1;
              const cardWidth = isCenter ? "clamp(130px, 30vw, 190px)" : "clamp(100px, 24vw, 150px)";
              const overlap = isCenter ? 0 : "-16px";
              const margin = isRtl
                ? { marginLeft: isCenter ? 0 : overlap }
                : { marginRight: isCenter ? 0 : overlap };
              return (
                <div key={item.id}
                  className="shrink-0"
                  style={{
                    width: cardWidth,
                    zIndex: isCenter ? 2 : 1,
                    transform: heroExited ? `rotate(${isRtl ? (isCenter ? 0 : i === 0 ? 45 : -45) : (isCenter ? 0 : i === 0 ? -45 : 45)}deg) translateX(${isRtl ? (isCenter ? 0 : i === 0 ? 600 : -600) : (isCenter ? 0 : i === 0 ? -600 : 600)}%)` : "translate3d(0,0,0)",
                    opacity: heroExited ? 0 : 1,
                    transition: mounted ? "transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.6s ease-out" : undefined,
                    ...margin,
                  }}>
                  <div
                    className="flex flex-col items-center text-center rounded-2xl overflow-visible"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.5)",
                      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.05)",
                    }}>
                    {/* Image — 4:3, pops out above card with shadow */}
                    <div
                      className="relative shrink-0"
                      style={{
                        width: "calc(100% + 16px)",
                        aspectRatio: "4 / 3",
                        marginTop: "-8px",
                        filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.15))",
                      }}>
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={name}
                          fill
                          sizes={cardWidth}
                          className="object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl overflow-hidden">
                          <Placeholder />
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-col items-center ${isCenter ? "gap-2 p-4" : "gap-1.5 p-3"}`}>
                      <h4 className={`font-bold truncate w-full ${isCenter ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`} style={{ color: P.deep }}>
                        {name}
                      </h4>
                      <p className={`leading-snug line-clamp-2 ${isCenter ? "text-[9px] sm:text-[11px]" : "text-[8px] sm:text-[10px]"}`} style={{ color: P.muted }}>
                        {desc}
                      </p>
                      <div className={`flex flex-wrap items-center justify-center ${isCenter ? "gap-1" : "gap-0.5"}`}>
                        {item.item_variants.slice(0, 2).map((v) => {
                          const sizeName = locale === "ar" ? v.size_name_ar : v.size_name_en;
                          return (
                            <span key={v.id}
                              className={`inline-flex items-center font-semibold whitespace-nowrap rounded-md ${isCenter ? "gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs" : "gap-0.5 px-1 py-0.5 text-[7px]"}`}
                              style={{ backgroundColor: `${P.warm}60`, color: P.deep }}>
                              {item.item_variants.length > 1 && sizeName && (
                                <span className="opacity-70">{sizeName}</span>
                              )}
                              <span style={{ color: P.accent }}>${v.price_usd.toFixed(2)}</span>
                            </span>
                          );
                        })}
                        {item.item_variants.length > 2 && (
                          <span className="opacity-60 text-[7px] sm:text-[9px]" style={{ color: P.muted }}>+{item.item_variants.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Sticky Header ────────────────────────── */}
      <header
        className="fixed left-0 right-0 z-40"
        style={{
          top: "0px",
          backgroundColor: "#f5efdf",
          boxShadow: showHeader ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
          transform: showHeader ? "translateY(0)" : "translateY(-100%)",
          opacity: showHeader ? 1 : 0,
          pointerEvents: showHeader ? "auto" : "none",
          transition: "transform 0.35s ease-out, opacity 0.25s ease-out, box-shadow 0.35s ease-out",
        }}>
        <div className="flex items-center gap-2 px-4" style={{ height: "64px" }}>
          <img
            src="/wooden-trans-logo.webp"
            alt="Shababik"
            className="shrink-0"
            style={{ height: "56px", width: "auto" }}
          />
          <LangToggle locale={locale} />
          <div className="flex-1 min-w-0">
            <nav className="scrollbar-hide overflow-x-auto">
              <div className="flex gap-1.5">
                {data.categories.map((cat) => {
                  const name = locale === "ar" ? cat.name_ar : cat.name_en;
                  const isActive = activeCatId === cat.id;
                  return (
                    <button key={cat.id} ref={captureButton} data-cat-id={cat.id} type="button" onClick={() => scrollTo(cat.id)}
                      className="shrink-0 whitespace-nowrap px-2 py-2.5 text-[11px] sm:text-xs font-medium tracking-wide transition-all duration-200"
                      style={{
                        color: isActive ? P.deep : `${P.deep}60`,
                        borderBottom: isActive ? `2px solid ${P.accent}` : "2px solid transparent",
                      }}>
                      {name}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Menu Content ────────────────────────── */}
      <div className="mx-auto max-w-4xl px-3 sm:px-4"
        style={{
          paddingTop: showHeader ? "64px" : "0px",
          transition: "padding-top 0.35s ease-out",
        }}>
        <main className={`pb-8 transition-all duration-700 ease-out ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {data.categories.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <p className="text-sm" style={{ color: P.muted }}>{locale === "ar" ? "القائمة قيد الإعداد" : "Menu coming soon"}</p>
            </div>
          ) : (
            data.categories.map((cat) => {
              const catName = locale === "ar" ? cat.name_ar : cat.name_en;
              return (
                <section key={cat.id} ref={observe} data-category-id={cat.id} className="mb-10 scroll-mt-20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1" style={{ backgroundColor: P.border }} />
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: P.deep }}>{catName}</h2>
                    <span className="text-[10px]" style={{ color: P.accent }}>♡</span>
                  </div>
                  <div className="space-y-3">
                    {cat.items.map((item) => {
                      const name = locale === "ar" ? item.name_ar : item.name_en;
                      const description = locale === "ar" ? item.description_ar : item.description_en;
                      return (
                        <article key={item.id} onClick={() => setSelectedItem(item)}
                          className="group cursor-pointer flex overflow-hidden rounded-xl transition-all duration-200"
                          style={{ backgroundColor: "rgba(255,252,248,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${P.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)", flexDirection: isRtl ? "row-reverse" : "row" }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${P.shadow}`; e.currentTarget.style.borderColor = P.accent; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = P.border; }}>
                          <div className="relative w-[110px] sm:w-[140px] shrink-0 aspect-[4/3] overflow-hidden" style={{ backgroundColor: `${P.warm}50` }}>
                            {item.image_url ? (
                              <Image src={item.image_url} alt={name} fill sizes="140px" className="object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                            ) : <Placeholder />}
                            {item.is_bestseller && (
                              <span className="absolute top-1.5 start-1.5 z-10 text-[8px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 text-white shadow-sm"
                                style={{ backgroundColor: P.accent }}>
                                ★ {locale === "ar" ? "الأكثر طلباً" : "BEST"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-center">
                            <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: P.deep }}>{name}</h3>
                            {description && (
                              <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed line-clamp-2" style={{ color: P.muted }}>{description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {item.item_variants.map((v) => {
                                const sizeName = locale === "ar" ? v.size_name_ar : v.size_name_en;
                                return (
                                  <span key={v.id} className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap"
                                    style={{ backgroundColor: `${P.warm}60`, color: P.deep }}>
                                    {item.item_variants.length > 1 && sizeName && <span className="opacity-70">{sizeName}</span>}
                                    <span style={{ color: P.accent }}>${v.price_usd.toFixed(2)}</span>
                                    <span className="opacity-50 text-[9px]">/ {v.price_syp.toLocaleString()}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </main>

        <footer className="py-5 text-center border-t" style={{ borderColor: P.border }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span style={{ color: P.accent }}>♡</span>
            <img src="/wooden-trans-logo.webp" alt="Shababik" className="h-5 w-auto opacity-60" />
            <span style={{ color: P.accent }}>♡</span>
          </div>
          <p className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: P.muted }}>
            &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
      <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
