"use client";

import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus, updateOrderTable, searchAndGroupOrders } from "@/lib/actions/orders";
import { getTables } from "@/lib/actions/tables";
import type { OrderRow, OrderItemRow, GroupedSession } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/format-currency";
import type { Currency, Table } from "@/types/database";
import ProLockedScreen from "@/components/admin/ProLockedScreen";
import AddItemsModal from "@/components/admin/AddItemsModal";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type Tab = "pending" | "kds" | "billing" | "history";

interface Order {
  id: string;
  tableNumber: string;
  secureToken: string | null;
  customerName: string | null;
  status: OrderStatus;
  items: { name: string; nameEn?: string; variant?: string; quantity: number; notes?: string; isAddedLater?: boolean; priceUsd?: number; priceSyp?: number; priceTry?: number }[];
  totalUsd: number;
  totalSyp: number;
  totalTry: number;
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
    secureToken: row.secure_token ?? null,
    customerName: row.customer_name ?? null,
    status: row.status as OrderStatus,
    items: (row.order_items ?? []).map((oi: OrderItemRow) => ({
      name: oi.item_name,
      nameEn: oi.item_name_en ?? undefined,
      variant: oi.variant_name ?? undefined,
      quantity: oi.quantity,
      notes: oi.notes ?? undefined,
      isAddedLater: oi.is_added_later ?? undefined,
      priceUsd: oi.price_usd ?? undefined,
      priceSyp: oi.price_syp ?? undefined,
      priceTry: oi.price_try ?? undefined,
    })),
    totalUsd: row.total_usd,
    totalSyp: row.total_syp,
    totalTry: row.total_try ?? 0,
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

function OrderCard({ order, locale, activeCurrency, enableUsd = true, showAudit = false, showFeedback = false, actions = [], onChangeTable, isInvoiceView = false }: { order: Order; locale: string; activeCurrency: Currency; enableUsd?: boolean; showAudit?: boolean; showFeedback?: boolean; actions?: { label: string; onClick: () => void; style?: React.CSSProperties; loading?: boolean }[]; onChangeTable?: (orderId: string, currentTable: string) => void; isInvoiceView?: boolean }) {
  return (
    <div className="bg-surface rounded-xl p-4 shadow-[0_1px_3px_rgba(212,196,176,0.25)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {!isInvoiceView && (
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: "monospace", fontSize: "11px" }}>#{order.id.slice(0, 8)}</span>
          )}
          {!isInvoiceView && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${STATUS_COLORS[order.status]}18`, color: STATUS_COLORS[order.status], border: `1px solid ${STATUS_COLORS[order.status]}30` }}>
              {t(locale, STATUS_LABELS[order.status].en, STATUS_LABELS[order.status].ar)}
            </span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#f5efdf", color: "#8a7a6a" }}>
            {formatTime(order.createdAt)}
          </span>
          {order.customerName && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: "#eaf5e8", color: "#5a8a3a" }}>
              {order.customerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#8a7a6a" }}>
            {t(locale, "Table", "الطاولة")} {order.tableNumber}
          </span>
          {!isInvoiceView && onChangeTable && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChangeTable(order.id, order.tableNumber); }}
              className="min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center hover:bg-[#9a6a3a]/10 transition-all border-0"
              title={t(locale, "Change Table", "تغيير الطاولة")}
            >
              <svg className="w-3 h-3" style={{ color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {order.items.map((item, i) => (
          <div key={i} className={`flex items-start justify-between py-1.5 ${item.isAddedLater ? "rounded-lg px-2 -mx-2" : ""}`}
            style={item.isAddedLater ? { backgroundColor: "#fef3c7", animation: "pulseAdded 2s ease-in-out infinite" } : undefined}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                  {item.quantity}x
                </span>
                <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                  {item.name}
                </span>
                {item.isAddedLater && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-0.5"
                    style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                    🔔 {t(locale, "New Addition", "إضافة جديدة")}
                  </span>
                )}
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
            <span className="text-xs font-bold tabular-nums shrink-0 ml-2" style={{ color: "#3B2818" }}>
              {(() => {
                const unitPrice = activeCurrency === "TRY" ? item.priceTry : item.priceSyp;
                if (unitPrice != null) {
                  return formatCurrency(unitPrice * item.quantity, activeCurrency, locale);
                }
                return null;
              })()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>
          {t(locale, "Total", "المجموع")}
        </span>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums" style={{ color: "#3B2818" }}>
            {formatCurrency(
              activeCurrency === "TRY" ? order.totalTry : order.totalSyp,
              activeCurrency,
              locale,
            )}
          </p>
          {enableUsd && order.totalUsd > 0 && (
            <p className="text-xs tabular-nums" style={{ color: "#8a7a6a" }}>
              {formatCurrency(order.totalUsd, "USD", locale)}
            </p>
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
  const [activeCurrency, setActiveCurrency] = useState<Currency>("TRY");
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

  const [changeTableOrderId, setChangeTableOrderId] = useState<string | null>(null);
  const [currentTableName, setCurrentTableName] = useState<string>("");
  const [tables, setTables] = useState<Table[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [changeTableLoading, setChangeTableLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [addItemsOrderId, setAddItemsOrderId] = useState<string | null>(null);

  const [billingQuery, setBillingQuery] = useState("");
  const [billingResults, setBillingResults] = useState<GroupedSession[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingSearched, setBillingSearched] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

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
    supabase.from("site_settings").select("tier, enable_usd, active_currency").eq("id", 1).single().then(({ data }) => {
      if (data) {
        setTier(data.tier as "basic" | "pro");
        setEnableUsd(data.enable_usd ?? true);
        setActiveCurrency(data.active_currency ?? "TRY");
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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === "billing" && !billingSearched) {
      handleBillingSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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

  const handleOpenChangeTable = useCallback(async (orderId: string, currentTable: string) => {
    setChangeTableOrderId(orderId);
    setCurrentTableName(currentTable);
    setTableSearch("");
    try {
      const rows = await getTables();
      setTables(rows);
    } catch {}
  }, []);

  const handleBillingSearch = useCallback(async (q: string) => {
    setBillingQuery(q);
    setBillingLoading(true);
    setBillingSearched(true);
    try {
      const res = await searchAndGroupOrders(q);
      setBillingResults(res.grouped);
    } catch {
      setBillingResults([]);
    }
    setBillingLoading(false);
  }, []);

  const handleChangeTable = useCallback(async (secureToken: string) => {
    if (!changeTableOrderId) return;
    setChangeTableLoading(true);
    const res = await updateOrderTable(changeTableOrderId, secureToken, "");
    if (res.success) {
      setToast({ message: t(locale, "Order moved to the new table successfully", "تم نقل الطلب للطاولة الجديدة بنجاح"), type: "success" });
      setChangeTableOrderId(null);
      fetchActiveOrders();
    } else {
      setToast({ message: res.error ?? t(locale, "Failed to change table", "فشل تغيير الطاولة"), type: "error" });
    }
    setChangeTableLoading(false);
  }, [changeTableOrderId, locale, fetchActiveOrders]);

  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    const q = tableSearch.toLowerCase();
    return tables.filter((t) => t.table_number.toLowerCase().includes(q));
  }, [tables, tableSearch]);

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
    { key: "billing", labelEn: "Billing", labelAr: "الفاتورة" },
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
                  <div key={order.id} className="space-y-2">
                  <OrderCard order={order} locale={locale} activeCurrency={activeCurrency} onChangeTable={handleOpenChangeTable} actions={[
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
                  <button
                    type="button"
                    onClick={() => setAddItemsOrderId(order.id)}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] border-0"
                    style={{ backgroundColor: "#f5efdf", color: "#5a4a3a" }}
                  >
                    {t(locale, "Edit / Add Items", "تعديل / إضافة أصناف")}
                  </button>
                  </div>
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
                  <div key={order.id} className="space-y-2">
                  <OrderCard order={order} locale={locale} activeCurrency={activeCurrency} onChangeTable={handleOpenChangeTable} actions={[
                    {
                      label: t(locale, "Ready", "جاهز"),
                      onClick: () => handleStatusUpdate(order.id, "completed"),
                      loading: loadingAction === order.id,
                      style: { backgroundColor: "#5a8a3a", color: "#fff" },
                    },
                  ]} />
                  <button
                    type="button"
                    onClick={() => setAddItemsOrderId(order.id)}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] border-0"
                    style={{ backgroundColor: "#f5efdf", color: "#5a4a3a" }}
                  >
                    {t(locale, "Edit / Add Items", "تعديل / إضافة أصناف")}
                  </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Billing Tab ── */}
          {tab === "billing" && (
            <div className="space-y-4">
              <div className="sticky top-0 z-10 bg-background pb-3 pt-1 no-print">
                <div className="relative">
                  <input
                    type="text"
                    value={billingQuery}
                    onChange={(e) => handleBillingSearch(e.target.value)}
                    placeholder={t(locale, "Search by name or table...", "ابحث باسم الزبون أو الطاولة...")}
                    className="w-full px-4 py-3 pl-10 rounded-xl text-sm bg-white border border-[#dcc8b4] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9a6a3a]/30 transition-all shadow-sm"
                  />
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7a6a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {billingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 animate-spin" style={{ color: "#9a6a3a" }} viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : !billingSearched ? (
                <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
                  <svg className="w-8 h-8 mx-auto mb-3" style={{ color: "#dcc8b4" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm" style={{ color: "#8a7a6a" }}>
                    {t(locale, "Search for a customer name or table to view their invoice", "ابحث عن اسم الزبون أو الطاولة لعرض الفاتورة")}
                  </p>
                </div>
              ) : billingResults.length === 0 ? (
                <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
                  <p className="text-sm" style={{ color: "#8a7a6a" }}>
                    {t(locale, "No results found", "لم يتم العثور على نتائج")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingResults.length > 0 && (
                    <div className="flex items-center justify-between px-1 py-2 border-b border-[#E8E6E1] no-print">
                      <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                        {t(locale, "Grand Total", "إجمالي الفاتورة")}
                      </span>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums" style={{ color: "#3B2818" }}>
                          {formatCurrency(
                            activeCurrency === "TRY"
                              ? billingResults.reduce((s, g) => s + g.grandTotalTry, 0)
                              : billingResults.reduce((s, g) => s + g.grandTotalSyp, 0),
                            activeCurrency,
                            locale,
                          )}
                        </p>
                        {enableUsd && billingResults.reduce((s, g) => s + g.grandTotalUsd, 0) > 0 && (
                          <p className="text-xs tabular-nums" style={{ color: "#8a7a6a" }}>
                            {formatCurrency(billingResults.reduce((s, g) => s + g.grandTotalUsd, 0), "USD", locale)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {billingResults.map((group) => {
                    const hasMultiple = group.orders.length > 1;
                    const isExpanded = expandedSessions.has(group.sessionId);
                    const visibleOrders = hasMultiple && !isExpanded
                      ? [group.orders[0]]
                      : group.orders;

                    return (
                      <div key={group.sessionId} id={`billing-group-${group.sessionId}`} className="bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25)] overflow-hidden">
                        {/* === Web UI Section (hidden during print) === */}
                        <div className="no-print p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                                {group.customerName || (locale === "ar" ? "بدون اسم" : "No Name")}
                              </span>
                              <span className="text-xs ml-2" style={{ color: "#8a7a6a" }}>
                                {t(locale, "Table", "الطاولة")} {group.tableNumber}
                              </span>
                            </div>
                            {hasMultiple && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
                                {t(locale, "Multiple orders from this customer", "طلبات متعددة لنفس الزبون")}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {visibleOrders.map((order) => (
                              <OrderCard
                                key={order.id}
                                order={toOrder(order)}
                                locale={locale}
                                activeCurrency={activeCurrency}
                                isInvoiceView
                              />
                            ))}
                          </div>

                          {hasMultiple && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedSessions((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(group.sessionId)) next.delete(group.sessionId);
                                  else next.add(group.sessionId);
                                  return next;
                                });
                              }}
                              className="w-full mt-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-0 flex items-center justify-center gap-1"
                              style={{ backgroundColor: "#f5efdf", color: "#5a4a3a" }}
                            >
                              {isExpanded
                                ? t(locale, "Collapse", "إخفاء التفاصيل")
                                : t(locale, `Show ${group.orders.length - 1} more orders`, `عرض ${group.orders.length - 1} طلبات إضافية`)}
                              <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}

                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E8E6E1]">
                            <span className="text-sm font-bold" style={{ color: "#3B2818" }}>
                              {t(locale, "Session Total", "إجمالي الجلسة")}
                            </span>
                            <div className="text-right">
                              <p className="text-base font-bold tabular-nums" style={{ color: "#3B2818" }}>
                                {formatCurrency(
                                  activeCurrency === "TRY" ? group.grandTotalTry : group.grandTotalSyp,
                                  activeCurrency,
                                  locale,
                                )}
                              </p>
                              {enableUsd && group.grandTotalUsd > 0 && (
                                <p className="text-xs tabular-nums" style={{ color: "#8a7a6a" }}>
                                  {formatCurrency(group.grandTotalUsd, "USD", locale)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* === Print Receipt Section (hidden until print) === */}
                        <div className="hidden print-receipt p-3 bg-white" dir={locale === "ar" ? "rtl" : "ltr"}>
                          <div className="text-center mb-2">
                            <img
                              src="/shababik-solid-logo.png"
                              alt="Shababik"
                              className="mx-auto"
                              style={{ width: "120px", height: "auto", filter: "grayscale(100%)" }}
                            />
                            <p className="text-[10px] text-gray-500 mt-1" style={{ fontFamily: "monospace" }}>
                              {new Date(group.orders[0].created_at)
                                .toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
                                .replace(/\//g, "/")}
                              {"  "}
                              {formatTime(group.orders[0].created_at)}
                            </p>
                            <p className="text-[11px] font-bold text-gray-800 mt-1">
                              {locale === "ar" ? "الزبون" : "Customer"}: {group.customerName || (locale === "ar" ? "—" : "—")}
                              <span className="mx-2">|</span>
                              {locale === "ar" ? "الطاولة" : "Table"}: {group.tableNumber}
                            </p>
                          </div>

                          <div className="border-b border-dashed border-gray-400 mb-2" />

                          {group.orders.map((order, oi) => (
                            <div key={order.id}>
                              {oi > 0 && group.orders.length > 1 && (
                                <div className="text-[9px] text-gray-400 text-center my-1">
                                  — {locale === "ar" ? "الطلب" : "Order"} {oi + 1} —
                                </div>
                              )}
                              <div className="space-y-0.5">
                                {toOrder(order).items.map((item, ii) => (
                                  <div key={ii} className="flex items-start justify-between text-[10px] leading-tight">
                                    <div className="flex-1 min-w-0 pr-2">
                                      <span className="font-bold text-gray-800">{item.quantity}x</span>{" "}
                                      <span className="text-gray-800">{item.name}</span>
                                      {item.variant && (
                                        <span className="text-gray-500"> ({item.variant})</span>
                                      )}
                                    </div>
                                    <span className="shrink-0 font-bold tabular-nums text-gray-800">
                                      {(() => {
                                        const unitPrice = activeCurrency === "TRY" ? item.priceTry : item.priceSyp;
                                        if (unitPrice != null) {
                                          return formatCurrency(unitPrice * item.quantity, activeCurrency, locale);
                                        }
                                        return null;
                                      })()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          <div className="border-b border-dashed border-gray-400 my-2" />

                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-gray-800">
                              {locale === "ar" ? "إجمالي الجلسة" : "Session Total"}
                            </span>
                            <span className="tabular-nums text-gray-900" style={{ fontSize: "13px" }}>
                              {formatCurrency(
                                activeCurrency === "TRY" ? group.grandTotalTry : group.grandTotalSyp,
                                activeCurrency,
                                locale,
                              )}
                            </span>
                          </div>
                          {enableUsd && group.grandTotalUsd > 0 && (
                            <div className="text-right text-[9px] text-gray-500 tabular-nums">
                              {formatCurrency(group.grandTotalUsd, "USD", locale)}
                            </div>
                          )}

                          <p className="text-center text-[10px] text-gray-500 mt-3">
                            {locale === "ar" ? "شكراً لزيارتكم" : "Thank you for your visit"}
                          </p>
                        </div>

                        <div className="px-4 pb-4 no-print">
                          <button
                            type="button"
                            onClick={() => {
                              const logoImg = document.querySelector('img[alt="Shababik"]') as HTMLImageElement | null;
                              const logoUrl = logoImg?.src || "/shababik-solid-logo.png";
                              const items = group.orders.flatMap((order) =>
                                toOrder(order).items.map((item) => ({
                                  qty: item.quantity,
                                  name: item.name,
                                  variant: item.variant || "",
                                  price: formatCurrency(
                                    (activeCurrency === "TRY" ? (item.priceTry ?? 0) : (item.priceSyp ?? 0)) * item.quantity,
                                    activeCurrency,
                                    locale,
                                  ),
                                  hasPrice: (activeCurrency === "TRY" ? item.priceTry : item.priceSyp) != null,
                                }))
                              );
                              const dateStr = new Date(group.orders[0].created_at)
                                .toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
                              const timeStr = formatTime(group.orders[0].created_at);
                              const totalStr = formatCurrency(
                                activeCurrency === "TRY" ? group.grandTotalTry : group.grandTotalSyp,
                                activeCurrency,
                                locale,
                              );
                              const usdStr = group.grandTotalUsd > 0
                                ? formatCurrency(group.grandTotalUsd, "USD", locale)
                                : "";
                              const customerStr = group.customerName || (locale === "ar" ? "—" : "—");
                              const tableStr = group.tableNumber;
                              const footerStr = locale === "ar" ? "شكراً لزيارتكم" : "Thank you for your visit";

                              const receiptHtml = `<!DOCTYPE html><html dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                body { font-family: -apple-system, sans-serif; width: 80mm; margin: 0 auto; padding: 3mm; background: white; color: #1a1a1a; font-size: 10px; line-height: 1.4; }
                                .logo { text-align: center; margin-bottom: 2mm; }
                                .logo img { width: 120px; height: auto; filter: grayscale(100%); }
                                .meta { text-align: center; margin-bottom: 2mm; }
                                .meta p { font-size: 9px; color: #666; }
                                .meta .info { font-size: 10px; font-weight: bold; color: #1a1a1a; margin-top: 1mm; }
                                .divider { border: none; border-top: 1px dashed #999; margin: 2mm 0; }
                                .item { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 0.5mm; }
                                .item .desc { flex: 1; }
                                .item .price { font-weight: bold; white-space: nowrap; }
                                .total { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-top: 2mm; }
                                .total .label { font-size: 11px; }
                                .usd { text-align: right; font-size: 9px; color: #666; }
                                .footer { text-align: center; font-size: 9px; color: #666; margin-top: 3mm; }
                              </style></head><body>
                                <div class="logo"><img src="${logoUrl}" alt="Logo"></div>
                                <div class="meta">
                                  <p>${dateStr}  ${timeStr}</p>
                                  <p class="info">${locale === "ar" ? "الزبون" : "Customer"}: ${customerStr} | ${locale === "ar" ? "الطاولة" : "Table"}: ${tableStr}</p>
                                </div>
                                <hr class="divider">
                                ${items.map((i) => `<div class="item"><span class="desc">${i.qty}x ${i.name}${i.variant ? ` (${i.variant})` : ""}</span>${i.hasPrice ? `<span class="price">${i.price}</span>` : ""}</div>`).join("")}
                                <hr class="divider">
                                <div class="total"><span class="label">${locale === "ar" ? "إجمالي الجلسة" : "Session Total"}</span><span>${totalStr}</span></div>
                                ${usdStr ? `<div class="usd">${usdStr}</div>` : ""}
                                <p class="footer">${footerStr}</p>
                              </body></html>`;

                              const iframe = document.createElement("iframe");
                              iframe.style.position = "fixed";
                              iframe.style.top = "0";
                              iframe.style.left = "0";
                              iframe.style.width = "100%";
                              iframe.style.height = "100%";
                              iframe.style.border = "none";
                              iframe.style.zIndex = "9999";
                              iframe.style.background = "white";
                              document.body.appendChild(iframe);
                              const doc = iframe.contentDocument || iframe.contentWindow!.document;
                              doc.open();
                              doc.write(receiptHtml);
                              doc.close();
                              iframe.contentWindow!.focus();
                              iframe.onload = () => {
                                iframe.contentWindow!.print();
                              };
                              setTimeout(() => {
                                iframe.contentWindow!.print();
                                setTimeout(() => document.body.removeChild(iframe), 500);
                              }, 300);
                            }}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border-0 flex items-center justify-center gap-2"
                            style={{ backgroundColor: "#3B2818", color: "#fff" }}
                          >
                            🖨️ {t(locale, "Print Invoice", "طباعة الفاتورة")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                            <OrderCard key={order.id} order={order} locale={locale} activeCurrency={activeCurrency} showAudit showFeedback />
                          ))}
                        </>
      )}
    </div>
                  )}
                </>
              )}
            </div>
          )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 inset-x-0 z-[100] pointer-events-none flex flex-col items-center">
          <div
            className="pointer-events-auto px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2"
            style={{
              backgroundColor: toast.type === "success" ? "#3B2818" : "#b55a5a",
              color: "#fff",
              maxWidth: "90vw",
            }}
          >
            {toast.type === "success" ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Add Items Modal */}
      {addItemsOrderId && (
        <AddItemsModal
          orderId={addItemsOrderId}
          locale={locale}
          onClose={() => setAddItemsOrderId(null)}
          onSuccess={() => {
            setAddItemsOrderId(null);
            fetchActiveOrders();
            setToast({ message: t(locale, "Items added to order", "تمت إضافة الأصناف للطلب بنجاح"), type: "success" });
          }}
        />
      )}

      {/* Change Table Bottom Sheet */}
      {changeTableOrderId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setChangeTableOrderId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setChangeTableOrderId(null)} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#f5efdf] rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "85dvh", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          >
            <div className="shrink-0 flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-[#dcc8b4]/60" />
            </div>

            <div className="shrink-0 px-5 pb-3">
              <h3 className="text-base font-bold text-center" style={{ color: "#3B2818" }}>
                {t(locale, `Change table from ${currentTableName} to:`, `تغيير الطاولة من ${currentTableName} إلى:`)}
              </h3>
            </div>

            <div className="px-5 pb-3">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={t(locale, "Search tables...", "ابحث عن طاولة...")}
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-[#dcc8b4] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9a6a3a]/30 transition-all"
              />
            </div>

            <div className="px-5 overflow-y-auto flex-1 min-h-0 pb-4">
              <div className="space-y-1">
                {filteredTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => handleChangeTable(table.secure_token)}
                    disabled={changeTableLoading}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all border-0 bg-white hover:bg-[#9a6a3a]/5 active:scale-[0.98] disabled:opacity-50"
                    style={{ color: "#3B2818" }}
                  >
                    <span>
                      {t(locale, "Table", "الطاولة")} {table.table_number}
                    </span>
                    {changeTableLoading && (
                      <svg className="w-4 h-4 animate-spin" style={{ color: "#9a6a3a" }} viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                  </button>
                ))}
                {filteredTables.length === 0 && (
                  <p className="text-center text-sm py-6" style={{ color: "#8a7a6a" }}>
                    {tableSearch.trim()
                      ? t(locale, "No tables match your search", "لا توجد طاولات تطابق بحثك")
                      : t(locale, "No tables available", "لا توجد طاولات متاحة")}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 px-5 pb-5">
              <button
                type="button"
                onClick={() => setChangeTableOrderId(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 transition-all border-0"
              >
                {t(locale, "Cancel", "إلغاء")}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <ProLockedScreen
          locale={locale}
          featureNameEn="Order Management"
          featureNameAr="نظام الطلبات"
          descriptionEn="The orders system is available exclusively in the Pro plan."
          descriptionAr="نظام الطلبات متاح حصرياً في الباقة الاحترافية."
        />
      )}

      <style>{`
        @keyframes pulseAdded {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }

        .print-receipt {
          display: none;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          aside, [class*="sidebar"], [class*="Sidebar"],
          [class*="NavRail"], [class*="BottomNav"], [class*="TopBar"],
          [class*="sticky"] {
            display: none !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
          }

          .print-invoice .print-receipt {
            display: block !important;
          }

          .print-invoice .no-print {
            display: none !important;
          }

          @page {
            size: 80mm auto;
            margin: 2mm;
          }
        }
      `}</style>
    </div>
  );
}
