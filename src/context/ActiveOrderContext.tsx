"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ActiveOrder {
  orderId: string;
  tableNumber: number;
  totalUsd: number;
  totalSyp: number;
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

  // Supabase Realtime subscription
  const supabaseRef = useRef(createClient());
  const orderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeOrder) return;

    const supabase = supabaseRef.current;
    orderIdRef.current = activeOrder.orderId;

    const channel = supabase
      .channel(`order-${activeOrder.orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${activeOrder.orderId}`,
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          const newStatus = newRow.status as string | undefined;
          if (!newStatus) return;

          setActiveOrderState((prev) => {
            if (!prev) return null;
            const updated = { ...prev, status: newStatus };
            saveOrder(updated);
            return updated;
          });
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.warn("Realtime channel subscribe status:", status);
        }
      });

    // On mount, fetch current status — bypass Next.js cache
    (async () => {
      try {
        const res = await fetch(`/api/order-status?orderId=${activeOrder.orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setActiveOrderState((prev) => {
          if (!prev || prev.orderId !== activeOrder.orderId) return prev;
          if (data.status !== prev.status) {
            const updated = { ...prev, status: data.status as string };
            saveOrder(updated);
            return updated;
          }
          return prev;
        });
      } catch {}
    })();

    return () => {
      supabase.removeChannel(channel);
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
