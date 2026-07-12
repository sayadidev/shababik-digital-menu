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
  clearActiveOrder: () => void;
  completedOrders: ActiveOrder[];
  feedbackPrompted: string[];
  markOrderPrompted: (orderId: string) => void;
}

const ORDER_KEY = "shababik_active_order";
const COMPLETED_KEY = "shababik_completed_orders";
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

function loadCompleted(): ActiveOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCompleted(orders: ActiveOrder[]) {
  if (typeof window === "undefined") return;
  try {
    if (orders.length === 0) {
      localStorage.removeItem(COMPLETED_KEY);
    } else {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(orders));
    }
  } catch {}
}

export function ActiveOrderProvider({ children }: { children: ReactNode }) {
  const [activeOrder, setActiveOrderState] = useState<ActiveOrder | null>(null);
  const [completedOrders, setCompletedOrders] = useState<ActiveOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [feedbackPrompted, setFeedbackPrompted] = useState<string[]>([]);

  useEffect(() => {
    setActiveOrderState(loadOrder());
    setCompletedOrders(loadCompleted());
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

  const clearActiveOrder = useCallback(() => {
    if (activeOrder) {
      setCompletedOrders((prev) => {
        const exists = prev.some((o) => o.orderId === activeOrder.orderId);
        if (exists) return prev;
        const next = [...prev, { ...activeOrder, status: "completed" }];
        saveCompleted(next);
        return next;
      });
    }
    setActiveOrderState(null);
    saveOrder(null);
  }, [activeOrder]);

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

  const supabaseRef = useRef(createClient());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeOrder) return;

    const supabase = supabaseRef.current;
    const orderId = activeOrder.orderId;

    const updateFromPayload = (newRow: Record<string, unknown>) => {
      const newStatus = newRow.status as string | undefined;
      const newTableNumber = newRow.table_number as string | undefined;

      setActiveOrderState((prev) => {
        if (!prev) return null;
        let updated = { ...prev };
        let changed = false;

        if (newStatus && prev.status !== newStatus) {
          updated.status = newStatus;
          changed = true;
        }
        if (newTableNumber !== undefined && prev.tableNumber !== newTableNumber) {
          updated.tableNumber = newTableNumber;
          changed = true;
        }

        if (!changed) return prev;
        saveOrder(updated);
        return updated;
      });
    };

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
          updateFromPayload(payload.new as Record<string, unknown>);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {}
      });

    const poll = async () => {
      try {
        const res = await fetch(`/api/order-status?orderId=${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        updateFromPayload({
          status: data?.status,
          table_number: data?.tableNumber,
        });
      } catch {}
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 10_000);

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
      <ActiveOrderContext.Provider value={{ activeOrder: null, setActiveOrder, clearActiveOrder, completedOrders: [], feedbackPrompted: [], markOrderPrompted }}>
        {children}
      </ActiveOrderContext.Provider>
    );
  }

  return (
    <ActiveOrderContext.Provider value={{ activeOrder, setActiveOrder, clearActiveOrder, completedOrders, feedbackPrompted, markOrderPrompted }}>
      {children}
    </ActiveOrderContext.Provider>
  );
}

export function useActiveOrder() {
  const ctx = useContext(ActiveOrderContext);
  if (!ctx) throw new Error("useActiveOrder must be used within ActiveOrderProvider");
  return ctx;
}
