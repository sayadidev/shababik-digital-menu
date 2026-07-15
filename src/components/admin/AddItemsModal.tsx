"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addItemsToOrder, removeOrderItem } from "@/lib/actions/orders";

interface MenuItem {
  id: string;
  name_en: string;
  name_ar: string;
  category_name_en: string;
  category_name_ar: string;
  variants: { size_name_en: string; size_name_ar: string; price_usd: number | null; price_syp: number | null; price_try: number | null }[];
}

interface SelectedItem {
  itemId: string;
  nameEn: string;
  nameAr: string;
  variantEn: string;
  variantAr: string;
  quantity: number;
}

export default function AddItemsModal({
  orderId,
  locale,
  onClose,
  onSuccess,
}: {
  orderId: string;
  locale: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentItems, setCurrentItems] = useState<{ id: string; itemName: string; variantName: string | null; quantity: number; isAddedLater?: boolean }[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("items")
      .select("id, name_en, name_ar, item_variants(size_name_en, size_name_ar, price_usd, price_syp, price_try), categories(name_en, name_ar)")
      .eq("is_active", true)
      .order("name_en")
      .then(({ data }) => {
        if (data) {
          const items: MenuItem[] = (data as any[]).map((row: any) => ({
            id: row.id,
            name_en: row.name_en,
            name_ar: row.name_ar,
            category_name_en: row.categories?.name_en ?? "",
            category_name_ar: row.categories?.name_ar ?? "",
            variants: (row.item_variants ?? []).map((v: any) => ({
              size_name_en: v.size_name_en,
              size_name_ar: v.size_name_ar,
              price_usd: v.price_usd,
              price_syp: v.price_syp,
              price_try: v.price_try,
            })),
          }));
          setMenuItems(items);
        }
        setLoading(false);
      });

    supabase
      .from("order_items")
      .select("id, item_name, variant_name, quantity, is_added_later")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setCurrentItems(data.map((row: any) => ({
            id: row.id,
            itemName: row.item_name,
            variantName: row.variant_name ?? null,
            quantity: row.quantity,
            isAddedLater: row.is_added_later ?? undefined,
          })));
        }
      });
  }, [orderId]);

  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);

  const handleAddItem = (item: MenuItem, variantIdx: number) => {
    const v = item.variants[variantIdx];
    const key = `${item.id}-${v.size_name_en}`;
    const existing = selected.find(
      (s) => `${s.itemId}-${s.variantEn}` === key,
    );
    if (existing) {
      setSelected((prev) =>
        prev.map((s) =>
          `${s.itemId}-${s.variantEn}` === key
            ? { ...s, quantity: s.quantity + 1 }
            : s,
        ),
      );
    } else {
      setSelected((prev) => [
        ...prev,
        {
          itemId: item.id,
          nameEn: item.name_en,
          nameAr: item.name_ar,
          variantEn: v.size_name_en,
          variantAr: v.size_name_ar,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (key: string) => {
    setSelected((prev) => prev.filter((s) => `${s.itemId}-${s.variantEn}` !== key));
  };

  const handleUpdateQty = (key: string, delta: number) => {
    setSelected((prev) =>
      prev
        .map((s) => {
          if (`${s.itemId}-${s.variantEn}` !== key) return s;
          const newQty = s.quantity + delta;
          if (newQty <= 0) return null;
          return { ...s, quantity: newQty };
        })
        .filter(Boolean) as SelectedItem[],
    );
  };

  const handleRemoveExisting = async (itemId: string) => {
    setRemoving(itemId);
    setError(null);
    const res = await removeOrderItem(itemId);
    if (res.success) {
      setCurrentItems((prev) => prev.filter((i) => i.id !== itemId));
      onSuccess();
    } else {
      setError(res.error ?? t("Failed to remove item", "فشل حذف الصنف"));
    }
    setRemoving(null);
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);

    const calculationItems = selected.map((s) => {
      const item = menuItems.find((m) => m.id === s.itemId);
      const variant = item?.variants.find((v) => v.size_name_en === s.variantEn);
      return {
        name: s.nameEn,
        variant: s.variantEn,
        quantity: s.quantity,
        priceUsd: variant?.price_usd ?? 0,
        priceSyp: variant?.price_syp ?? 0,
        priceTry: variant?.price_try ?? 0,
      };
    });

    const additionalUsd = calculationItems.reduce((sum, ci) => sum + ci.priceUsd * ci.quantity, 0);
    const additionalSyp = calculationItems.reduce((sum, ci) => sum + ci.priceSyp * ci.quantity, 0);
    const additionalTry = calculationItems.reduce((sum, ci) => sum + ci.priceTry * ci.quantity, 0);

    const res = await addItemsToOrder(
      orderId,
      selected.map((s) => ({
        name: s.nameAr,
        nameEn: s.nameEn,
        variant: s.variantAr,
        quantity: s.quantity,
      })),
      additionalUsd,
      additionalSyp,
      additionalTry,
    );

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error ?? t("Failed to add items", "فشل إضافة الأصناف"));
    }
    setSaving(false);
  };

  const categories = [...new Set(menuItems.map((i) => i.category_name_en))];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
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
            {t("Edit Order Items", "تعديل أصناف الطلب")}
          </h3>
        </div>

        {/* Current order items */}
        {currentItems.length > 0 && (
          <div className="shrink-0 px-5 pb-3">
            <div className="bg-white rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold" style={{ color: "#8a7a6a" }}>
                {t("Current items:", "الأصناف الحالية:")}
              </p>
              {currentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: "#3B2818" }}>
                    <span className="font-bold">{item.quantity}x</span>{" "}
                    {item.itemName}
                    {item.variantName ? ` (${item.variantName})` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExisting(item.id)}
                    disabled={removing === item.id}
                    className="min-w-[22px] min-h-[22px] rounded-full flex items-center justify-center text-[11px] border-0 disabled:opacity-50"
                    style={{ backgroundColor: "#fce8e8", color: "#b55a5a" }}
                    title={t("Remove item", "حذف الصنف")}
                  >
                    {removing === item.id ? (
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      "🗑️"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Selected items summary */}
        {selected.length > 0 && (
          <div className="shrink-0 px-5 pb-3">
            <div className="bg-white rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold" style={{ color: "#8a7a6a" }}>
                {t("Selected items:", "الأصناف المحددة:")}
              </p>
              {selected.map((s) => {
                const key = `${s.itemId}-${s.variantEn}`;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span style={{ color: "#3B2818" }}>
                      <span className="font-bold">{s.quantity}x</span>{" "}
                      {locale === "ar" ? s.nameAr : s.nameEn}
                      {" — "}
                      {locale === "ar" ? s.variantAr : s.variantEn}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(key, -1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200 text-gray-600 border-0"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(key, 1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200 text-gray-600 border-0"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(key)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-0 ml-1"
                        style={{ backgroundColor: "#fce8e8", color: "#b55a5a" }}
                      >
                        x
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu items */}
        <div className="px-5 overflow-y-auto flex-1 min-h-0 pb-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-6 h-6 animate-spin" style={{ color: "#9a6a3a" }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = menuItems.filter((i) => i.category_name_en === cat);
              const catNameAr = catItems[0]?.category_name_ar ?? cat;
              return (
                <div key={cat} className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "#8a7a6a" }}>
                    {locale === "ar" ? catNameAr : cat}
                  </h4>
                  <div className="space-y-1">
                    {catItems.map((item) =>
                      item.variants.map((variant, vi) => (
                        <button
                          key={`${item.id}-${vi}`}
                          type="button"
                          onClick={() => handleAddItem(item, vi)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs bg-white hover:bg-[#9a6a3a]/5 active:scale-[0.98] transition-all border-0"
                        >
                          <span style={{ color: "#3B2818" }}>
                            {locale === "ar" ? item.name_ar : item.name_en}
                            {item.variants.length > 1 && (
                              <span style={{ color: "#8a7a6a", marginLeft: "4px" }}>
                                — {locale === "ar" ? variant.size_name_ar : variant.size_name_en}
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] font-bold tabular-nums" style={{ color: "#9a6a3a" }}>
                            + {variant.price_try ? `₺${variant.price_try}` : variant.price_syp ? `${variant.price_syp} ل.س` : ""}
                          </span>
                        </button>
                      )),
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <div className="shrink-0 px-5 pb-2">
            <p className="text-xs text-center font-medium" style={{ color: "#b55a5a" }}>{error}</p>
          </div>
        )}

        <div className="shrink-0 px-5 pb-5 pt-2 border-t border-[#E8E6E1] bg-[#f5efdf] sticky bottom-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={selected.length === 0 || saving}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all border-0 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#9a6a3a", color: "#fff" }}
          >
            {saving ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {saving ? t("Saving...", "جارٍ الحفظ...") : t("Save & Add to Order", "حفظ وإضافة للطلب")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-black/5 transition-all border-0"
          >
            {t("Cancel", "إلغاء")}
          </button>
        </div>
      </div>
    </div>
  );
}
