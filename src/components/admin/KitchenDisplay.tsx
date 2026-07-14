"use client";

import { useState, useEffect, useCallback } from "react";

interface KitchenItem {
  name: string;
  variant?: string;
  quantity: number;
  notes?: string;
  isAddedLater?: boolean;
}

interface KitchenOrder {
  id: string;
  dailyOrderNumber: number | null;
  tableNumber: string;
  items: KitchenItem[];
  createdAt: string;
}

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

const STORAGE_KEY = "kds_pinned_orders";

function loadPinned(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function savePinned(pinned: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...pinned]));
  } catch {}
}

function ElapsedTimer({ since, locale }: { since: string; locale: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startMs = new Date(since).getTime();
  if (isNaN(startMs)) return <span className="text-[11px] text-gray-400">--:--</span>;

  const totalSeconds = Math.max(0, Math.floor((now - startMs) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let label: string;
  let colorClass: string;

  if (minutes >= 99) {
    label = "99+";
  } else {
    label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  if (totalSeconds < 60) {
    colorClass = "normal";
  } else if (minutes < 5) {
    colorClass = "normal";
  } else if (minutes < 10) {
    colorClass = "warning";
  } else {
    colorClass = "urgent";
  }

  const colors: Record<string, { bg: string; text: string; border: string }> = {
    normal: { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" },
    warning: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    urgent: { bg: "#fecaca", text: "#991b1b", border: "#f87171" },
  };
  const c = colors[colorClass];

  return (
    <span
      className="inline-flex items-center tabular-nums font-mono text-lg font-bold px-2 py-1 rounded whitespace-nowrap min-w-[56px] justify-center"
      style={{ color: c.text, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function isToday(iso: string): boolean {
  try {
    const d = new Date(iso);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

function KitchenOrderCard({
  order,
  locale,
  isPinned,
  onTogglePin,
  onReady,
  onEditItems,
  loading,
}: {
  order: KitchenOrder;
  locale: string;
  isPinned: boolean;
  onTogglePin: () => void;
  onReady: () => void;
  onEditItems: () => void;
  loading: boolean;
}) {
  const showDate = !isToday(order.createdAt);

  return (
    <div
      className="flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm w-full h-full"
    >
      {/* ── Urgency top bar ── */}
      <UrgencyBar since={order.createdAt} />

      {/* ── Header ── */}
      <div className="flex justify-between items-start p-3 gap-2">
        {/* Left: Chef tools — Pin + Timer + Order # */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePin}
              className="min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center border-0 transition-colors"
              style={{
                backgroundColor: isPinned ? "#fef3c7" : "#f3f4f6",
                fontSize: "13px",
              }}
              title={t(locale, isPinned ? "Unpin" : "Pin", isPinned ? "إلغاء التثبيت" : "تثبيت")}
            >
              {isPinned ? "📌" : "📍"}
            </button>
            <span className="text-xs font-bold font-mono" style={{ color: "#5a4a3a" }}>
              {order.dailyOrderNumber != null ? `#${order.dailyOrderNumber}` : `#${order.id.slice(0, 8)}`}
            </span>
          </div>
          <ElapsedTimer since={order.createdAt} locale={locale} />
        </div>

        {/* Right: Waiter tools — Table + Edit */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
              {t(locale, "Table", "الطاولة")} {order.tableNumber}
            </span>
            <button
              type="button"
              onClick={onEditItems}
              className="min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center border-0 hover:bg-gray-100 transition-colors"
              title={t(locale, "Edit / Add Items", "تعديل / إضافة أصناف")}
            >
              <svg className="w-3.5 h-3.5" style={{ color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
          {showDate && (
            <span className="text-[10px]" style={{ color: "#8a7a6a" }}>
              {formatTime(order.createdAt)}
            </span>
          )}
        </div>
      </div>

      {/* ── Body: Order Items ── */}
      <div className="px-4 py-3 flex-1">
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 leading-relaxed ${
                item.isAddedLater
                  ? "rounded-lg px-2 py-1.5 -mx-2"
                  : "py-0.5"
              }`}
              style={
                item.isAddedLater
                  ? { backgroundColor: "#fef3c7", animation: "kdsPulse 2s ease-in-out infinite" }
                  : undefined
              }
            >
              <span
                className="text-base font-extrabold tabular-nums shrink-0 leading-snug"
                style={{ color: "#3B2818", minWidth: "2em" }}
              >
                {item.quantity}x
              </span>
              <div className="min-w-0">
                <span className="text-base font-bold leading-snug" style={{ color: "#3B2818" }}>
                  {item.name}
                </span>
                {item.isAddedLater && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 ml-1.5 align-middle"
                    style={{ backgroundColor: "#ef4444", color: "#fff" }}
                  >
                    🔔 {t(locale, "New", "جديد")}
                  </span>
                )}
                {item.variant && (
                  <p className="text-xs mt-0.5" style={{ color: "#8a7a6a" }}>
                    {t(locale, "Size:", "الحجم:")} {item.variant}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs font-bold italic mt-0.5 flex items-center gap-1" style={{ color: "#dc2626" }}>
                    ⚠️ {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer: Actions ── */}
      <div className="px-4 py-3 flex flex-col gap-2 border-t mt-auto">
        <button
          type="button"
          onClick={onEditItems}
          className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] border"
          style={{ backgroundColor: "#fff", color: "#5a4a3a", borderColor: "#dcc8b4" }}
        >
          {t(locale, "Edit / Add Items", "تعديل / إضافة أصناف")}
        </button>
        <button
          type="button"
          onClick={onReady}
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-bold active:scale-[0.98] transition-all border-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
          style={{ backgroundColor: "#5a8a3a", color: "#fff" }}
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {t(locale, "Ready", "جاهز")}
        </button>
      </div>
    </div>
  );
}

function UrgencyBar({ since }: { since: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const startMs = new Date(since).getTime();
  if (isNaN(startMs)) return <div className="h-1 w-full shrink-0" style={{ backgroundColor: "#d1d5db" }} />;

  const totalSeconds = Math.max(0, Math.floor((now - startMs) / 1000));
  const minutes = Math.floor(totalSeconds / 60);

  let bg: string;
  if (minutes >= 10) bg = "#dc2626";
  else if (minutes >= 5) bg = "#f59e0b";
  else if (totalSeconds >= 60) bg = "#d1d5db";
  else bg = "#e5e7eb";

  return (
    <div
      className="h-1 w-full shrink-0 transition-colors duration-700"
      style={{ backgroundColor: bg }}
    />
  );
}

export default function KitchenDisplay({
  orders,
  locale,
  onReady,
  onEditItems,
  loadingAction,
}: {
  orders: KitchenOrder[];
  locale: string;
  onReady: (orderId: string) => void;
  onEditItems: (orderId: string) => void;
  loadingAction: string | null;
}) {
  const [pinned, setPinned] = useState<Set<string>>(() => loadPinned());

  useEffect(() => {
    savePinned(pinned);
  }, [pinned]);

  const togglePin = useCallback((orderId: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const sortedOrders = [...orders].sort((a, b) => {
    const aPinned = pinned.has(a.id) ? 1 : 0;
    const bPinned = pinned.has(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (orders.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <p className="text-sm" style={{ color: "#8a7a6a" }}>
          {t(locale, "Kitchen is clear", "المطبخ جاهز")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 auto-rows-min">
      {sortedOrders.map((order) => (
        <KitchenOrderCard
          key={order.id}
          order={order}
          locale={locale}
          isPinned={pinned.has(order.id)}
          onTogglePin={() => togglePin(order.id)}
          onReady={() => onReady(order.id)}
          onEditItems={() => onEditItems(order.id)}
          loading={loadingAction === order.id}
        />
      ))}
    </div>
  );
}
