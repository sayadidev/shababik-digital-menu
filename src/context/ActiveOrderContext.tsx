"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ActiveOrder {
  orderId: string;
  tableNumber: number;
  totalUsd: number;
  totalSyp: number;
  items: { name: string; quantity: number; notes?: string }[];
  status: string;
  createdAt: string;
}

interface ActiveOrderContextType {
  activeOrder: ActiveOrder | null;
  setActiveOrder: (order: ActiveOrder | null) => void;
}

const ORDER_KEY = "shababik_active_order";

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

  useEffect(() => {
    setActiveOrderState(loadOrder());
    setHydrated(true);
  }, []);

  const setActiveOrder = useCallback((order: ActiveOrder | null) => {
    setActiveOrderState(order);
    saveOrder(order);
  }, []);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!activeOrder) return;

    const supabase = createClient();
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
          const newStatus = (payload.new as Record<string, unknown>).status as string | undefined;
          if (!newStatus) return;

          setActiveOrderState((prev) => {
            if (!prev) return null;
            const updated = { ...prev, status: newStatus };
            saveOrder(updated);
            return updated;
          });
        },
      )
      .subscribe();

    // On mount, fetch current status
    (async () => {
      try {
        const res = await fetch(`/api/order-status?orderId=${activeOrder.orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== activeOrder.status) {
          setActiveOrderState((prev) => (prev ? { ...prev, status: data.status } : null));
        }
      } catch {}
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) {
    return (
      <ActiveOrderContext.Provider value={{ activeOrder: null, setActiveOrder }}>
        {children}
      </ActiveOrderContext.Provider>
    );
  }

  return (
    <ActiveOrderContext.Provider value={{ activeOrder, setActiveOrder }}>
      {children}
    </ActiveOrderContext.Provider>
  );
}

export function useActiveOrder() {
  const ctx = useContext(ActiveOrderContext);
  if (!ctx) throw new Error("useActiveOrder must be used within ActiveOrderProvider");
  return ctx;
}
