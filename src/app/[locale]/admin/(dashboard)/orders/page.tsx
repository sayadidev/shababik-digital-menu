"use client";

import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { OrderRow, OrderItemRow } from "@/lib/actions/orders";
import { formatSyp } from "@/lib/format-currency";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type Tab = "pending" | "kds" | "history";

interface Order {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  items: { name: string; variant?: string; quantity: number; notes?: string }[];
  totalUsd: number;
  totalSyp: number;
  createdAt: string;
  acceptedBy: string | null;
  completedBy: string | null;
  rating: number | null;
  feedbackText: string | null;
}

// ── DB row → display Order ──

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    tableNumber: row.table_number,
    status: row.status as OrderStatus,
    items: (row.order_items ?? []).map((oi: OrderItemRow) => ({
      name: oi.item_name,
      variant: oi.variant_name ?? undefined,
      quantity: oi.quantity,
      notes: oi.notes ?? undefined,
    })),
    totalUsd: row.total_usd,
    totalSyp: row.total_syp,
    createdAt: row.created_at,
    acceptedBy: row.accepted_by ?? null,
    completedBy: row.completed_by ?? null,
    rating: row.rating ?? null,
    feedbackText: row.feedback_text ?? null,
  };
}

// ── Constants ──

const STATUS_LABELS: Record<OrderStatus, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  processing: { en: "Processing", ar: "قيد التحضير" },
  completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#d4a017",
  processing: "#9a6a3a",
  completed: "#5a8a3a",
  cancelled: "#b55a5a",
};

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function formatTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}

function dateKey(iso: string): string {
  try { return new Date(iso).toISOString().split("T")[0]; } catch { return iso; }
}

function sameDay(a: string, b: string): boolean {
  return dateKey(a) === dateKey(b);
}

// ── Calendar ──

function CalendarPicker({ value, onChange, locale }: { value: string; onChange: (d: string) => void; locale: string }) {
  const [month, setMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(month.year, month.month, 1).getDay();
  const todayStr = dateKey(new Date().toISOString());
  const selectedDate = value.split("T")[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setMonth(m => ({ year: m.month === 0 ? m.year - 1 : m.year, month: m.month === 0 ? 11 : m.month - 1 }))}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold hover:bg-primary/10 transition-all border-0"
          style={{ color: "#8a7a6a" }}>
          ←
        </button>
        <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
          {new Date(month.year, month.month).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" })}
        </span>
        <button type="button" onClick={() => setMonth(m => ({ year: m.month === 11 ? m.year + 1 : m.year, month: m.month === 11 ? 0 : m.month + 1 }))}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold hover:bg-primary/10 transition-all border-0"
          style={{ color: "#8a7a6a" }}>
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <span key={d} className="text-center text-[10px] font-semibold uppercase py-1" style={{ color: "#8a7a6a" }}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const dateStr = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <button key={d} type="button" onClick={() => onChange(dateStr)}
              className="w-full aspect-square rounded-lg text-xs font-semibold transition-all border-0 flex items-center justify-center"
              style={{
                backgroundColor: isSelected ? "#9a6a3a" : "transparent",
                color: isSelected ? "#fff" : isToday ? "#9a6a3a" : "#3B2818",
              }}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Order Card ──

function OrderCard({ order, locale, enableUsd, showAudit = false, showFeedback = false, actions = [] }: { order: Order; locale: string; enableUsd: boolean; showAudit?: boolean; showFeedback?: boolean; actions?: { label: string; onClick: () => void; style?: React.CSSProperties; loading?: boolean }[] }) {
  return (
    <div className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground" style={{ fontFamily: "monospace", fontSize: "11px" }}>#{order.id.slice(0, 8)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${STATUS_COLORS[order.status]}18`, color: STATUS_COLORS[order.status], border: `1px solid ${STATUS_COLORS[order.status]}30` }}>
            {t(locale, STATUS_LABELS[order.status].en, STATUS_LABELS[order.status].ar)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#f5efdf", color: "#8a7a6a" }}>
            {formatTime(order.createdAt)}
          </span>
        </div>
        <span className="text-xs" style={{ color: "#8a7a6a" }}>
          {t(locale, "Table", "طاولة")} {order.tableNumber}
        </span>
      </div>

      <div className="divide-y divide-border/30">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start justify-between py-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                  {item.quantity}x
                </span>
                <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                  {item.name}
                </span>
              </div>
              {item.variant && (
                <p className="text-xs ml-6 mt-0.5" style={{ color: "#8a7a6a" }}>
                  {t(locale, "Size:", "الحجم:")} {item.variant}
                </p>
              )}
              {item.notes && (
                <p className="text-xs font-bold italic ml-6 mt-0.5 flex items-center gap-1" style={{ color: "#dc2626" }}>
                  ⚠️ {t(locale, "Note:", "ملاحظة:")} {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>
          {t(locale, "Total", "المجموع")}
        </span>
        <div className="text-right">
          {enableUsd ? (
            <>
              <p className="text-sm font-bold tabular-nums" style={{ color: "#3B2818" }}>${order.totalUsd.toFixed(2)}</p>
              <p className="text-xs tabular-nums" style={{ color: "#8a7a6a" }}>{formatSyp(order.totalSyp, locale)}</p>
            </>
          ) : (
            <p className="text-sm font-bold tabular-nums" style={{ color: "#3B2818" }}>{formatSyp(order.totalSyp, locale)}</p>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          {actions.map((action, i) => (
            <button key={i} type="button" onClick={action.onClick} disabled={action.loading}
              className="flex-1 py-2 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all border-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={action.style || {}}>
              {action.loading && (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {showAudit && (order.acceptedBy || order.completedBy) && (
        <div className="pt-2 border-t border-border/30 space-y-0.5">
          {order.acceptedBy && (
            <p className="text-[10px]" style={{ color: "#8a7a6a" }}>
              {t(locale, "Accepted by:", "تم القبول بواسطة:")}{" "}
              <span className="font-medium" style={{ color: "#5a4a3a" }}>{order.acceptedBy}</span>
            </p>
          )}
          {order.completedBy && (
            <p className="text-[10px]" style={{ color: "#8a7a6a" }}>
              {t(locale, "Completed by:", "تم الإنجاز بواسطة:")}{" "}
              <span className="font-medium" style={{ color: "#5a4a3a" }}>{order.completedBy}</span>
            </p>
          )}
        </div>
      )}

      {showFeedback && order.rating && (
        <div className="pt-2 border-t border-border/30 space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{ color: "#8a7a6a" }}>
              {t(locale, "Rating:", "التقييم:")}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={star <= order.rating! ? "#F59E0B" : "#E5E7EB"}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-bold tabular-nums ml-1" style={{ color: "#3B2818" }}>{order.rating}/5</span>
          </div>
          {order.feedbackText && (
            <p className="text-[11px] italic" style={{ color: "#5a4a3a" }}>
              &ldquo;{order.feedbackText}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──

export default function OrdersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [tier, setTier] = useState<"basic" | "pro">("basic");
  const [enableUsd, setEnableUsd] = useState(true);
  const [tierLoading, setTierLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [processingOrders, setProcessingOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<{ completed: Order[]; cancelled: Order[] }>({ completed: [], cancelled: [] });
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  const playDing = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1047, now + 0.06);
      osc.frequency.setValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }, [audioEnabled]);

  const handleEnableAudio = useCallback(async () => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      setAudioEnabled(true);
      setAudioReady(true);
      // play a subtle test ding
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      setAudioReady(false);
    }
  }, []);

  // ── Tier check ──
  useEffect(() => {
    const supabase = createClient();
    supabase.from("site_settings").select("tier, enable_usd").eq("id", 1).single().then(({ data }) => {
      if (data) {
        setTier(data.tier as "basic" | "pro");
        setEnableUsd(data.enable_usd ?? true);
      }
      setTierLoading(false);
    }, () => {
      setTierLoading(false);
    });
  }, []);

  // ── Role check ──
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.app_metadata?.role === "staff") {
        setIsStaff(true);
      }
      setUserEmail(session?.user?.email ?? null);
      setRoleLoaded(true);
    });
  }, []);

  // ── Fetch active orders (pending + processing) ──
  const fetchActiveOrders = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: true });

      if (error) return;

      const rows = (data as OrderRow[]) ?? [];
      setPendingOrders(rows.filter(r => r.status === "pending").map(toOrder));
      setProcessingOrders(rows.filter(r => r.status === "processing").map(toOrder));
      setLoaded(true);
    } catch {}
  }, []);

  useEffect(() => { fetchActiveOrders(); }, [fetchActiveOrders]);

  // ── Fetch history orders when date or tab changes ──
  useEffect(() => {
    if (tab !== "history" || tier !== "pro") return;
    setHistoryLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const start = `${historyDate}T00:00:00Z`;
        const end = `${historyDate}T23:59:59Z`;

        const { data: completed } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("status", "completed")
          .gte("completed_at", start)
          .lte("completed_at", end)
          .order("completed_at", { ascending: false });

        const { data: cancelled } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("status", "cancelled")
          .gte("updated_at", start)
          .lte("updated_at", end)
          .order("updated_at", { ascending: false });

        setHistoryOrders({
          completed: (completed as OrderRow[])?.map(toOrder) ?? [],
          cancelled: (cancelled as OrderRow[])?.map(toOrder) ?? [],
        });
      } catch {} finally {
        setHistoryLoading(false);
      }
    })();
  }, [tab, historyDate, tier]);

  // ── Real-time subscription (replaces polling) ──
  useEffect(() => {
    if (tier !== "pro") return;

    const supabase = createClient();

    const channel = supabase
      .channel("orders-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const newRow = payload.new as OrderRow;
          if (newRow.status === "pending") {
            try {
              const { data } = await supabase
                .from("orders")
                .select("*, order_items(*)")
                .eq("id", newRow.id)
                .single();
              if (data) {
                const order = toOrder(data as OrderRow);
                setPendingOrders((prev) => [order, ...prev]);
                if (!loaded) setLoaded(true);
                playDing();
              }
            } catch {}
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>)?.status;
          if (newStatus === "processing") {
            playDing();
          }
          fetchActiveOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tier, fetchActiveOrders, playDing, loaded]);

  // ── Action handlers ──

  const handleStatusUpdate = useCallback(async (orderId: string, status: OrderStatus) => {
    setLoadingAction(orderId);

    if (status === "completed" || status === "cancelled") {
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
      setProcessingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else if (status === "processing") {
      const order = pendingOrders.find((o) => o.id === orderId);
      if (order) {
        setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
        setProcessingOrders((prev) => [
          ...prev,
          { ...order, status: "processing", acceptedBy: userEmail },
        ]);
      }
    }

    const res = await updateOrderStatus(orderId, status, userEmail);
    if (res.success) {
      router.refresh();
    } else {
      fetchActiveOrders();
    }
    setLoadingAction(null);
  }, [pendingOrders, router, userEmail, fetchActiveOrders]);

  const history = useMemo(() => historyOrders, [historyOrders]);

  const topItems = useMemo(() => {
    const count = new Map<string, number>();
    for (const order of history.completed) {
      for (const item of order.items) {
        count.set(item.name, (count.get(item.name) || 0) + item.quantity);
      }
    }
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history.completed]);

  if (tierLoading || !roleLoaded) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto flex items-center justify-center" style={{ minHeight: "50vh" }}>
        <svg className="w-6 h-6 animate-spin" style={{ color: "#9a6a3a" }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!loaded && tier === "pro") {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto flex items-center justify-center" style={{ minHeight: "50vh" }}>
        <svg className="w-6 h-6 animate-spin" style={{ color: "#9a6a3a" }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const TABS: { key: Tab; labelEn: string; labelAr: string; count?: number }[] = [
    { key: "pending", labelEn: "Pending Orders", labelAr: "قيد الانتظار", count: pendingOrders.length },
    { key: "kds", labelEn: "Kitchen Display", labelAr: "شاشة المطبخ", count: processingOrders.length },
    ...(isStaff ? [] : [{ key: "history" as Tab, labelEn: "Order History", labelAr: "سجل الطلبات" }]),
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {tier === "pro" ? (
        <>
          {/* ── Audio Alerts Toggle ── */}
          <div className="flex items-center justify-end mb-3">
            <button
              type="button"
              onClick={() => {
                if (audioEnabled) {
                  setAudioEnabled(false);
                } else {
                  handleEnableAudio();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] border-0"
              style={{
                backgroundColor: audioEnabled ? "#5a8a3a" : "#f5efdf",
                color: audioEnabled ? "#fff" : "#8a7a6a",
              }}
            >
              {audioEnabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l3.7-3.2c.4-.3 1-.1 1 .4v12c0 .5-.6.7-1 .4L6.5 15.2H4a2 2 0 01-2-2v-4a2 2 0 012-2h2.5z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a2 2 0 01-2-2v-4a2 2 0 012-2h1.586l4.707-3.706C10.923 3.043 12 3.232 12 4v16c0 .768-1.077.957-1.707.294L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
              {audioEnabled
                ? t(locale, "Audio Alerts Active", "التنبيهات الصوتية مفعلة")
                : t(locale, "Enable Audio Alerts", "تفعيل التنبيهات الصوتية")}
            </button>
          </div>

          {/* ── Tab Navigation ── */}
          <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ backgroundColor: "#f5efdf" }}>
            {TABS.map((tabItem) => (
              <button key={tabItem.key} type="button" onClick={() => setTab(tabItem.key)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border-0 relative"
                style={{
                  backgroundColor: tab === tabItem.key ? "#fff" : "transparent",
                  color: tab === tabItem.key ? "#3B2818" : "#8a7a6a",
                  boxShadow: tab === tabItem.key ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}>
                {t(locale, tabItem.labelEn, tabItem.labelAr)}
                {tabItem.count !== undefined && tabItem.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#9a6a3a", color: "#fff" }}>
                    {tabItem.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Pending Orders Tab ── */}
          {tab === "pending" && (
            pendingOrders.length === 0 ? (
              <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
                <p className="text-sm" style={{ color: "#8a7a6a" }}>
                  {t(locale, "No pending orders", "لا توجد طلبات قيد الانتظار")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} locale={locale} enableUsd={enableUsd} actions={[
                    {
                      label: t(locale, "Accept", "قبول"),
                      onClick: () => handleStatusUpdate(order.id, "processing"),
                      loading: loadingAction === order.id,
                      style: { backgroundColor: "#9a6a3a", color: "#fff" },
                    },
                    {
                      label: t(locale, "Reject", "رفض"),
                      onClick: () => handleStatusUpdate(order.id, "cancelled"),
                      loading: loadingAction === order.id,
                      style: { backgroundColor: "#fce8e8", color: "#b55a5a" },
                    },
                  ]} />
                ))}
              </div>
            )
          )}

          {/* ── Kitchen Display Tab ── */}
          {tab === "kds" && (
            processingOrders.length === 0 ? (
              <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
                <p className="text-sm" style={{ color: "#8a7a6a" }}>
                  {t(locale, "Kitchen is clear", "المطبخ جاهز")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {processingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} locale={locale} enableUsd={enableUsd} actions={[
                    {
                      label: t(locale, "Ready", "جاهز"),
                      onClick: () => handleStatusUpdate(order.id, "completed"),
                      loading: loadingAction === order.id,
                      style: { backgroundColor: "#5a8a3a", color: "#fff" },
                    },
                  ]} />
                ))}
              </div>
            )
          )}

          {/* ── History & Calendar Tab ── */}
          {tab === "history" && (
            <div className="space-y-4">
              <div className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
                <CalendarPicker value={historyDate} onChange={setHistoryDate} locale={locale} />
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 animate-spin" style={{ color: "#9a6a3a" }} viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)] text-center">
                      <p className="text-2xl font-bold" style={{ color: "#5a8a3a" }}>{history.completed.length}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#8a7a6a" }}>
                        {t(locale, "Completed", "منجز")}
                      </p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)] text-center">
                      <p className="text-2xl font-bold" style={{ color: "#b55a5a" }}>{history.cancelled.length}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#8a7a6a" }}>
                        {t(locale, "Incomplete", "غير منجز")}
                      </p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)] text-center">
                      <p className="text-2xl font-bold" style={{ color: "#9a6a3a" }}>{history.completed.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#8a7a6a" }}>
                        {t(locale, "Items Sold", "مباع")}
                      </p>
                    </div>
                  </div>

                  {topItems.length > 0 && (
                    <div className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#3B2818" }}>
                        {t(locale, "Top Items", "الأصناف الأكثر طلباً")}
                      </h3>
                      <div className="space-y-2">
                        {topItems.map(([name, count], i) => (
                          <div key={name} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold w-5 text-center" style={{ color: "#8a7a6a" }}>#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-medium truncate" style={{ color: "#3B2818" }}>{name}</span>
                                <span className="text-xs font-bold tabular-nums" style={{ color: "#9a6a3a" }}>x{count}</span>
                              </div>
                              <div className="h-1.5 rounded-full" style={{ backgroundColor: "#f5efdf" }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (count / Math.max(...topItems.map(([, c]) => c))) * 100)}%`, backgroundColor: "#9a6a3a" }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {history.completed.length === 0 && history.cancelled.length === 0 ? (
                    <div className="bg-surface rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
                      <p className="text-sm" style={{ color: "#8a7a6a" }}>
                        {t(locale, "No orders for this date", "لا توجد طلبات في هذا التاريخ")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.completed.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4" style={{ color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>
                              {t(locale, "Completed Orders", "الطلبات المنجزة")}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#eaf5e8", color: "#5a8a3a" }}>
                              {history.completed.length}
                            </span>
                          </div>
                          {history.completed.map((order) => (
                            <OrderCard key={order.id} order={order} locale={locale} enableUsd={enableUsd} showAudit showFeedback />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      ) : (
        /* ── Locked overlay for basic tier ── */
        <div className="bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25)] overflow-hidden relative">
          <div className="p-4 space-y-3 blur-sm select-none pointer-events-none">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface/50 rounded-xl p-4 space-y-3 border border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 bg-muted/20 rounded" />
                    <div className="h-4 w-12 bg-muted/20 rounded-full" />
                  </div>
                  <div className="h-3 w-14 bg-muted/20 rounded" />
                </div>
                <div className="space-y-2"><div className="h-3 w-24 bg-muted/20 rounded" /><div className="h-3 w-20 bg-muted/20 rounded" /></div>
                <div className="flex items-center justify-between pt-1 border-t border-border/20"><div className="h-3 w-10 bg-muted/20 rounded" /><div className="h-4 w-16 bg-muted/20 rounded" /></div>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6"
            style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", backgroundColor: "rgba(255, 252, 248, 0.3)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: "#f5efdf" }}>🔒</div>
            <div className="text-center max-w-xs">
              <p className="text-sm font-bold mb-1" style={{ color: "#3B2818" }}>
                {t(locale, "Upgrade to Pro", "ترقية إلى الباقة الاحترافية")}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#8a7a6a" }}>
                {t(locale, "The orders system is available exclusively in the Pro plan.", "نظام الطلبات متاح حصرياً في الباقة الاحترافية.")}
              </p>
            </div>
            <a href={`/${locale}/admin/settings`}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border-0"
              style={{ backgroundColor: "#9a6a3a", color: "#fff" }}>
              {t(locale, "Go to Settings", "الذهاب إلى الإعدادات")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
