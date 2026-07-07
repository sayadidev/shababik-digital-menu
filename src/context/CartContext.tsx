"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";

export interface CartItem {
  itemId: string;
  variantId: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string;
  variantNameEn: string;
  variantNameAr: string;
  priceUsd: number;
  priceSyp: number;
  priceTry: number;
  quantity: number;
  notes: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "notes">, quantity?: number, notes?: string) => void;
  updateQuantity: (variantId: string, delta: number) => void;
  updateNotes: (variantId: string, notes: string) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPriceUsd: number;
  totalPriceSyp: number;
  totalPriceTry: number;
}

const CART_KEY = "shababik_cart";

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  const saveAndSet = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      saveCart(next);
      return next;
    });
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "quantity" | "notes">, quantity = 1, notesVal?: string) => {
    saveAndSet((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity, notes: notesVal || i.notes } : i,
        );
      }
      return [...prev, { ...item, quantity, notes: notesVal || "" }];
    });
  }, [saveAndSet]);

  const updateQuantity = useCallback((variantId: string, delta: number) => {
    saveAndSet((prev) =>
      prev
        .map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0),
    );
  }, [saveAndSet]);

  const updateNotes = useCallback((variantId: string, notes: string) => {
    saveAndSet((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, notes } : i)));
  }, [saveAndSet]);

  const removeItem = useCallback((variantId: string) => {
    saveAndSet((prev) => prev.filter((i) => i.variantId !== variantId));
  }, [saveAndSet]);

  const clearCart = useCallback(() => {
    saveAndSet(() => []);
  }, [saveAndSet]);

  const { totalItems, totalPriceUsd, totalPriceSyp, totalPriceTry } = useMemo(() => {
    let ti = 0, tu = 0, ts = 0, tt = 0;
    for (const item of items) {
      ti += item.quantity;
      tu += item.priceUsd * item.quantity;
      ts += item.priceSyp * item.quantity;
      tt += item.priceTry * item.quantity;
    }
    return { totalItems: ti, totalPriceUsd: tu, totalPriceSyp: ts, totalPriceTry: tt };
  }, [items]);

  if (!hydrated) {
    return (
      <CartContext.Provider
        value={{ items: [], addItem: (() => {}) as CartContextType["addItem"], updateQuantity, updateNotes, removeItem, clearCart, totalItems: 0, totalPriceUsd: 0, totalPriceSyp: 0, totalPriceTry: 0 }}
      >
        {children}
      </CartContext.Provider>
    );
  }

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, updateNotes, removeItem, clearCart, totalItems, totalPriceUsd, totalPriceSyp, totalPriceTry }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
