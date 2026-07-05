"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { trackMenuLoad } from "@/lib/track-menu-load";
import ItemDetailSheet from "@/components/menu/ItemDetailSheet";
import AddToCartSheet from "@/components/menu/AddToCartSheet";
import FloatingCart from "@/components/menu/FloatingCart";
import FloatingActiveOrder from "@/components/menu/FloatingActiveOrder";
import CartReviewSheet from "@/components/menu/CartReviewSheet";
import { ToastProvider, useToast } from "@/components/menu/Toast";
import { GlobeIcon } from "@/components/admin/icons";
import type { MenuData, ItemWithVariants } from "@/lib/menu";

/* ── Design 10: Rose Petal ─────────────────
   Dark coffeehouse (#3B2818) + warm beige (#D4B895)
   + vivid rose (#B8743A) accent. Soft & romantic.
────────────────────────────────────────────────── */

const P = {
  deep: "#3B2818",
  warm: "#D4B895",
  bg: "#f5efdf",
  surface: "#fffcf8",
  text: "#2c1a0e",
  muted: "#7a6a56",
  accent: "#B8743A",
  border: "#dcc8b4",
  shadow: "rgba(184,116,58,0.12)",
};

function LangToggle({ locale }: { locale: string }) {
  const [mounted, setMounted] = useState(false);
  const [other, setOther] = useState(locale === "en" ? "ar" : "en");
  useEffect(() => { setMounted(true); }, []);
  const href = mounted ? `/${other}${typeof window !== "undefined" ? window.location.pathname.replace(/^\/(en|ar)/, "/") : "/"}` : "#";
  return (
    <button
      onClick={() => { window.location.href = href; }}
      className="p-2 rounded-full text-[#8C6B4A] hover:bg-black/5 transition-colors"
      title={locale === "en" ? "العربية" : "English"}
    >
      <GlobeIcon className="w-5 h-5" />
    </button>
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
  const s = data.settings;
  const heroBg = s?.hero_image_url || "/hero.jpg?v=3";
  const heroLogo = s?.hero_logo_url || "/shababik-solid-logo.png";
  const headerLogo = s?.header_logo_url || "/shababik-solid-logo.png";
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [activeCatId, setActiveCatId] = useState<string | null>(data.categories[0]?.id ?? null);
  const [loaded, setLoaded] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithVariants | null>(null);
  const [addToCartItem, setAddToCartItem] = useState<{
    item: ItemWithVariants;
    variant: ItemWithVariants["item_variants"][0] | null;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [heroExited, setHeroExited] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tickingRef = useRef(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchOpenRef = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { trackMenuLoad().catch(() => {}); setTimeout(() => setLoaded(true), 100); }, []);
  useEffect(() => { setMounted(true); }, []);
  // Read table number from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("table");
    if (t) {
      const n = parseInt(t, 10);
      if (n > 0) setTableNumber(n);
    }
  }, []);
  // Enable card animation after first paint — prevents mount flicker
  useEffect(() => {
    const raf = requestAnimationFrame(() => setCanAnimate(true));
    const fallback = setTimeout(() => setCanAnimate(true), 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, []);

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
          setHeroExited(window.scrollY > 20);
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    setHeroExited(window.scrollY > 20);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    searchOpenRef.current = searchOpen;
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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
      { rootMargin: "-90px 0px -60% 0px", threshold: 0 },
    );
    const sections = document.querySelectorAll("[data-category-id]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [data.categories]);

  const orderingEnabled = data.settings?.tier === "pro" && data.settings?.ordering_enabled;
  const enableUsd = data.settings?.enable_usd ?? true;

  const handleItemClick = useCallback((item: ItemWithVariants) => {
    if (searchOpenRef.current) {
      setSearchOpen(false);
      setSearchQuery("");
    }
    if (orderingEnabled) {
      setAddToCartItem({ item, variant: item.item_variants[0] ?? null });
    } else {
      setSelectedItem(item);
    }
  }, [orderingEnabled]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return data.categories
      .flatMap(c => c.items)
      .filter(item =>
        item.name_en.toLowerCase().includes(q) ||
        item.name_ar.toLowerCase().includes(q) ||
        (item.description_en && item.description_en.toLowerCase().includes(q)) ||
        (item.description_ar && item.description_ar.toLowerCase().includes(q))
      );
  }, [searchQuery, data.categories]);

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



  const scrollTo = (id: string) => {
    const el = sectionRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderItemRow = (item: ItemWithVariants) => {
    const name = locale === "ar" ? item.name_ar : item.name_en;
    const description = locale === "ar" ? item.description_ar : item.description_en;
    return (
      <article
        key={item.id}
        onClick={() => handleItemClick(item)}
        className="flex gap-4 py-4 border-b border-[#E8E6E1]/50 last:border-0 active:scale-[0.98] transition-transform cursor-pointer"
      >
        <div className="relative w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] shrink-0">
          {item.image_url ? (
            <>
              <Image
                src={item.image_url}
                alt={name}
                fill
                sizes="100px"
                className="object-cover rounded-xl"
                loading="lazy"
              />
              {item.is_bestseller && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#B8743A] text-[10px] font-bold flex items-center justify-center text-white shadow-sm z-10">
                  ★
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-full h-full rounded-xl flex items-center justify-center bg-[#F4F0EA]">
                <Placeholder />
              </div>
              {item.is_bestseller && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#B8743A] text-[10px] font-bold flex items-center justify-center text-white shadow-sm z-10">
                  ★
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900">{name}</h3>
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
              {description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {item.item_variants.map((v) => {
              const sizeName =
                locale === "ar" ? v.size_name_ar : v.size_name_en;
              return (
                <div
                  key={v.id}
                  className="inline-flex items-baseline gap-1 px-2 py-0.5 rounded-md bg-[#F4F0EA] text-xs"
                >
                  {item.item_variants.length > 1 && sizeName && (
                    <span className="text-gray-600">{sizeName}</span>
                  )}
                  {v.is_offer && v.price_before_usd != null && enableUsd && (
                    <span className="line-through opacity-50">
                      ${v.price_before_usd.toFixed(2)}
                    </span>
                  )}
                  {enableUsd ? (
                    <span className="tabular-nums font-semibold text-gray-900">
                      ${v.price_usd.toFixed(2)}
                    </span>
                  ) : null}
                  {v.is_offer && v.price_before_syp != null && (
                    <span className="line-through opacity-50">
                      {v.price_before_syp.toLocaleString()}
                    </span>
                  )}
                  <span className={`tabular-nums ${enableUsd ? "text-[10px] text-gray-400" : "font-semibold text-gray-900"}`}>
                    {v.price_syp.toLocaleString()}{!enableUsd ? " SYP" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      {/* ── Hero — logo + 3 featured glassy cards ── */}
      {!searchOpen && (
      <section ref={heroRef}
        className="relative flex flex-col items-center overflow-hidden min-h-[92dvh] md:min-h-[100dvh] pt-[10dvh] md:pt-[16dvh]"
        style={{
          backgroundImage: `linear-gradient(to top, ${P.bg} 0%, ${P.bg} 8%, transparent 25%), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}>
        <div className="relative z-[2] flex flex-col items-center">
        <img
          src={heroLogo}
          alt="Shababik"
          fetchPriority="high"
          className="transition-all duration-700 ease-out"
          style={{
            height: loaded ? "clamp(7rem, 20vw, 11rem)" : "4rem",
            width: "auto",
            opacity: loaded ? 1 : 0,
          }}
        />
        {featuredItems.length > 0 && (
          <div ref={cardsRef}
            className="flex items-center justify-center mt-3 md:mt-12 w-full max-w-2xl mx-auto px-1 md:px-4 overflow-visible"
            style={{
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.7s ease-out",
            }}>
            {featuredItems.map((item, i) => {
              const name = locale === "ar" ? item.name_ar : item.name_en;
              const desc = locale === "ar" ? item.description_ar : item.description_en;
              const isCenter = i === 1;
              const cardWidth = isCenter ? "clamp(140px, 38vw, 190px)" : "clamp(115px, 28vw, 150px)";
              const overlap = isCenter ? 0 : "-12px";
              const rotation = isCenter ? "0deg" : i === 0 ? (isRtl ? "4deg" : "-4deg") : (isRtl ? "-4deg" : "4deg");
              const heroScale = isCenter ? 1 : 0.9;
              const margin = isRtl
                ? (i === 0 ? { marginLeft: overlap } : isCenter ? {} : { marginRight: overlap })
                : (i === 0 ? { marginRight: overlap } : isCenter ? {} : { marginLeft: overlap });
              return (
                <div key={item.id}
                  className="shrink-0 cursor-pointer active:scale-[0.97] transition-transform"
                  onClick={() => handleItemClick(item)}
                  style={{
                    width: cardWidth,
                    zIndex: isCenter ? 2 : 1,
                    transform: heroExited
                      ? (isCenter
                        ? `translateX(0) rotate(0deg) scale(1)`
                        : `translateX(${isRtl ? (i === 0 ? "100vw" : "-100vw") : (i === 0 ? "-100vw" : "100vw")}) rotate(${rotation}) scale(${heroScale})`)
                      : `translateX(0) rotate(${rotation}) scale(${heroScale})`,
                    opacity: heroExited ? (isCenter ? 0 : 1) : 1,
                    transition: canAnimate ? "transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.6s ease-out" : "none",
                    willChange: "transform, opacity",
                    ...margin,
                  }}>
                  <div
                    className="relative rounded-2xl"
                    style={{ overflow: "visible" }}>
                    {/* Glass background — stable layer */}
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.75)",
                      }}
                    />
                    {/* Border + shadow on a separate overlay */}
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        border: "1px solid rgba(255, 255, 255, 0.5)",
                        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.05)",
                      }}
                    />
                    {/* Content */}
                    <div className="relative z-[1] flex flex-col items-center text-center overflow-visible">
                      {/* Image — 4:3, pops out above card with shadow */}
                      <div
                        className="relative shrink-0"
                        style={{
                          width: "calc(100% + 20px)",
                          aspectRatio: "4 / 3",
                          marginTop: "-12px",
                          filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.18))",
                        }}>
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={name}
                            fill
                            sizes="(max-width: 640px) 38vw, 190px"
                            className="object-cover rounded-xl"
                            {...(isCenter ? { priority: true } : { loading: "eager" })}
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
                        <p className={`leading-snug line-clamp-2 ${isCenter ? "text-[9px] sm:text-[11px]" : "text-[8px] sm:text-[10px]"}`} style={{ color: "#5a4a3a" }}>
                          {desc}
                        </p>
                        <div className={`flex flex-wrap items-center justify-center ${isCenter ? "gap-1" : "gap-0.5"}`}>
                          {item.item_variants.slice(0, 2).map((v) => {
                            const sizeName = locale === "ar" ? v.size_name_ar : v.size_name_en;
                            return (
                              <span key={v.id}
                                className={`inline-flex items-center gap-0.5 font-semibold whitespace-nowrap rounded-md ${isCenter ? "px-1.5 py-0.5 text-[10px] sm:text-xs" : "px-1 py-0.5 text-[7px]"}`}
                                style={{ backgroundColor: `${P.warm}60`, color: P.deep }}>
                                {item.item_variants.length > 1 && sizeName && (
                                  <span className="opacity-70">{sizeName}</span>
                                )}
                                {enableUsd ? (
                                  <>
                                    <span style={{ color: "#4A2C17" }}>${v.price_usd.toFixed(2)}</span>
                                    <span style={{ color: "#4A2C17" }}>/ {v.price_syp.toLocaleString()}</span>
                                  </>
                                ) : (
                                  <span style={{ color: "#4A2C17" }}>{v.price_syp.toLocaleString()}</span>
                                )}
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
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* ── Swipe-Up Indicator ────────────────────── */}
        <div className={`absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 transition-all duration-700 ease-out ${heroExited ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
          style={{ pointerEvents: "none", zIndex: 10 }}>

          {/* Expanding ring behind the pill */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full animate-ping"
              style={{ backgroundColor: P.accent, opacity: 0.12, animationDuration: "2.5s" }} />
          </div>

          {/* Glass pill backdrop for visibility over any hero image */}
          <div className="relative flex flex-col items-center gap-0 px-7 py-3.5 rounded-2xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2)",
              animation: "gentle-float 2.4s ease-in-out infinite",
            }}>
            <svg className="w-6 h-6 -mb-1.5" fill="none" stroke={P.accent} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            <svg className="w-6 h-6 -mt-1.5" fill="none" stroke={P.accent} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>
      )}

      {/* ── Unified Sticky Header ────────────────── */}
      <header
        className="fixed left-0 right-0 z-50"
        style={{
          top: "0px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          backgroundColor: "rgba(245,239,223,0.82)",
          boxShadow: (showHeader || searchOpen) ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
          borderBottom: (showHeader || searchOpen) ? "1px solid #dcc8b4" : "1px solid transparent",
          transform: (showHeader || searchOpen) ? "translateY(0)" : "translateY(-100%)",
          opacity: (showHeader || searchOpen) ? 1 : 0,
          pointerEvents: (showHeader || searchOpen) ? "auto" : "none",
          transition: "transform 0.35s ease-out, opacity 0.25s ease-out",
        }}>
        {/* ── Top Bar: Lang · Logo · Table Pill ──── */}
        <div className="w-full flex items-center px-4 py-3">
          <div className="flex-1 flex justify-start">
            <LangToggle locale={locale} />
          </div>
          <img
            src={headerLogo}
            alt="Shababik"
            className="h-8 w-28 object-contain shrink-0"
          />
          <div className="flex-1 flex justify-end">
            {tableNumber && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: `${P.deep}0e`, color: P.deep }}>
                {locale === "ar" ? `طاولة ${tableNumber}` : `Table ${tableNumber}`}
              </span>
            )}
          </div>
        </div>

        {/* ── Categories Nav + Expandable Search ──────── */}
        <nav className="flex items-center px-4 pb-2.5 min-h-[44px]">
          {/* Categories tabs (hidden when search is open) */}
          <div className={`scrollbar-hide overflow-x-auto flex-1 min-w-0 ${searchOpen ? 'hidden' : ''}`}>
            <div className="flex gap-1" dir={isRtl ? "rtl" : "ltr"}>
              {data.categories.map((cat) => {
                const name = locale === "ar" ? cat.name_ar : cat.name_en;
                const isActive = activeCatId === cat.id;
                return (
                  <button key={cat.id} ref={captureButton} data-cat-id={cat.id} type="button" onClick={() => scrollTo(cat.id)}
                    className="shrink-0 whitespace-nowrap px-3.5 py-2.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 rounded-lg relative border-0"
                    style={{
                      color: isActive ? P.accent : P.muted,
                      backgroundColor: isActive ? `${P.accent}15` : "transparent",
                    }}>
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search input + Cancel (hidden when search is closed) */}
          <div className={`flex-1 flex items-center gap-2 ${!searchOpen ? 'hidden' : ''}`}>
            <svg className="w-4 h-4 shrink-0" style={{ color: P.muted }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن عنصر..." : "Search items..."}
              className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50 min-w-0"
              style={{ color: P.deep }}
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="shrink-0 text-xs font-semibold px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
              style={{ color: P.accent }}
            >
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>

          {/* Search icon button (hidden when search is open) */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`shrink-0 ml-1 p-2 rounded-lg hover:bg-black/5 transition-colors ${searchOpen ? 'hidden' : ''}`}
            style={{ color: P.muted }}
            aria-label={locale === "ar" ? "بحث" : "Search"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
        </nav>
      </header>

      {/* ── Menu Content ────────────────────────── */}
      <div className="mx-auto max-w-4xl px-3 sm:px-4"
        style={{
          paddingTop: (showHeader || searchOpen) ? "90px" : "0px",
        }}>
        <main className={`transition-all duration-700 ease-out ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${orderingEnabled ? "pb-24" : "pb-8"}`}>
          {/* ── Empty state (no categories at all) ── */}
          {data.categories.length === 0 && !searchQuery.trim() ? (
            <div className="flex flex-col items-center py-24 text-center">
              <p className="text-sm" style={{ color: P.muted }}>{locale === "ar" ? "القائمة قيد الإعداد" : "Menu coming soon"}</p>
            </div>
          ) : searchOpen && searchQuery.trim() ? (
            /* ── Search Results ── */
            filteredItems.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center gap-2">
                <svg className="w-10 h-10" style={{ color: P.muted, opacity: 0.4 }} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-sm" style={{ color: P.muted }}>
                  {locale === "ar" ? "لا توجد نتائج" : "No results found"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredItems.map(renderItemRow)}
              </div>
            )
          ) : (
            /* ── Normal Categorised Layout ── */
            data.categories.map((cat) => {
              const catName = locale === "ar" ? cat.name_ar : cat.name_en;
              return (
                <section key={cat.id} ref={observe} data-category-id={cat.id} className="mb-8 scroll-mt-20">
                  <div className={`flex items-center gap-3 mb-5 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="h-[1.5px] flex-1 rounded-full" style={{ background: `linear-gradient(to ${isRtl ? "left" : "right"}, ${P.border}, transparent)` }} />
                    <h2 className="text-sm font-bold tracking-normal" style={{ color: P.deep }}>{catName}</h2>
                    <span className="text-[11px] leading-none" style={{ color: P.accent }}>♡</span>
                    <div className="h-[1.5px] flex-1 rounded-full" style={{ background: `linear-gradient(to ${isRtl ? "right" : "left"}, ${P.border}, transparent)` }} />
                  </div>
                  {cat.items.map(renderItemRow)}
                </section>
              );
            })
          )}
        </main>

        <footer style={{ backgroundColor: P.bg, borderTop: `1px solid ${P.border}` }}>
          <div className="mx-auto max-w-4xl px-3 sm:px-4 py-8 sm:py-10">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3 w-full max-w-xs mb-1">
                <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${P.border})` }} />
                <span style={{ color: P.accent, fontSize: "6px" }}>✦</span>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${P.border})` }} />
              </div>
              <p className="text-xs font-bold uppercase" style={{ color: P.muted }}>
                Shababik
              </p>
              <p className="text-[10px]" style={{ color: `${P.muted}99` }}>
                &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </div>
      {orderingEnabled ? (
        <>
          <AddToCartSheet
            item={addToCartItem?.item ?? null}
            variant={addToCartItem?.variant ?? null}
            locale={locale}
            enableUsd={enableUsd}
            onClose={() => setAddToCartItem(null)}
          />
          <FloatingActiveOrder locale={locale} />
          <FloatingCart locale={locale} tableNumber={tableNumber} enableUsd={enableUsd} onReview={() => setReviewOpen(true)} />
          {reviewOpen && (
            <CartReviewSheet tableNumber={tableNumber} locale={locale} enableUsd={enableUsd} onClose={() => setReviewOpen(false)} />
          )}
        </>
      ) : (
        <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
