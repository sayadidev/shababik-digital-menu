"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ActiveOrder {
  orderId: string;
  tableNumber: string;
  totalUsd: number;
  totalSyp: number;
  totalTry: number;
  items: { name: string; variant?: string; quantity: number; notes?: string }[];
  status: string;
  createdAt: string;
}

interface ActiveOrderContextType {
  activeOrder: ActiveOrder | null;
  setActiveOrder: (order: ActiveOrder | null) => void;
  feedbackPrompted: string[];
  markOrderPrompted: (orderId: string) => void;
}

const ORDER_KEY = "shababik_active_order";
const FEEDBACK_PROMPTED_KEY = "shababik_feedback_prompted";

const ActiveOrderContext = createContext<ActiveOrderContextType | null>(null);

function loadOrder(): ActiveOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveOrder(order: ActiveOrder | null) {
  if (typeof window === "undefined") return;
  try {
    if (order) {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } else {
      localStorage.removeItem(ORDER_KEY);
    }
  } catch {}
}

export function ActiveOrderProvider({ children }: { children: ReactNode }) {
  const [activeOrder, setActiveOrderState] = useState<ActiveOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [feedbackPrompted, setFeedbackPrompted] = useState<string[]>([]);

  useEffect(() => {
    setActiveOrderState(loadOrder());
    try {
      const raw = localStorage.getItem(FEEDBACK_PROMPTED_KEY);
      if (raw) setFeedbackPrompted(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const setActiveOrder = useCallback((order: ActiveOrder | null) => {
    setActiveOrderState(order);
    saveOrder(order);
  }, []);

  const markOrderPrompted = useCallback((orderId: string) => {
    setFeedbackPrompted((prev) => {
      if (prev.includes(orderId)) return prev;
      const next = [...prev, orderId];
      try {
        localStorage.setItem(FEEDBACK_PROMPTED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Supabase Realtime subscription + polling fallback
  const supabaseRef = useRef(createClient());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeOrder) return;

    const supabase = supabaseRef.current;
    const orderId = activeOrder.orderId;
    let isSubscribed = false;

    const updateStatus = (newStatus: string) => {
      setActiveOrderState((prev) => {
        if (!prev) return null;
        if (prev.status === newStatus) return prev;
        const updated = { ...prev, status: newStatus };
        saveOrder(updated);
        return updated;
      });
    };

    // ── Realtime subscription ──────────────────────────────────────────
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          const newStatus = newRow.status as string | undefined;
          if (newStatus) updateStatus(newStatus);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          isSubscribed = true;
        }
      });

    // ── Polling fallback (every 10s) ───────────────────────────────────
    const poll = async () => {
      try {
        const res = await fetch(`/api/order-status?orderId=${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.status) updateStatus(data.status);
      } catch {}
    };

    // Initial fetch to catch any changes since order was placed
    poll();

    // Start polling
    pollIntervalRef.current = setInterval(poll, 10_000);

    // ── Cleanup ────────────────────────────────────────────────────────
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeOrder?.orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) {
    return (
      <ActiveOrderContext.Provider value={{ activeOrder: null, setActiveOrder, feedbackPrompted: [], markOrderPrompted }}>
        {children}
      </ActiveOrderContext.Provider>
    );
  }

  return (
    <ActiveOrderContext.Provider value={{ activeOrder, setActiveOrder, feedbackPrompted, markOrderPrompted }}>
      {children}
    </ActiveOrderContext.Provider>
  );
}

export function useActiveOrder() {
  const ctx = useContext(ActiveOrderContext);
  if (!ctx) throw new Error("useActiveOrder must be used within ActiveOrderProvider");
  return ctx;
}
