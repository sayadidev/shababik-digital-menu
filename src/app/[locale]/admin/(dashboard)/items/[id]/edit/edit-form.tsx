"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateItem } from "@/lib/actions/item";
import { setVariants } from "@/lib/actions/item-variant";
import ImageUpload from "@/components/admin/ImageUpload";
import type { CategoryRow } from "@/lib/validations";

type ItemData = {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image_url: string;
  is_active: boolean;
  is_bestseller: boolean;
  view_count: number;
  variants: {
    id: string;
    size_name_en: string;
    size_name_ar: string;
    price_usd?: number | null;
    price_syp?: number | null;
    price_try?: number | null;
    is_offer: boolean;
    price_before_usd?: number | null;
    price_before_syp?: number | null;
    price_before_try?: number | null;
  }[];
};

type Variant = {
  id: string;
  sizeEn: string;
  sizeAr: string;
  priceUsd: string;
  priceSyp: string;
  priceTry: string;
  isOffer: boolean;
  priceBeforeUsd: string;
  priceBeforeSyp: string;
  priceBeforeTry: string;
};

function dataToVariants(item: ItemData): Variant[] {
  if (item.variants.length === 0) {
    return [{ id: crypto.randomUUID(), sizeEn: "", sizeAr: "", priceUsd: "", priceSyp: "", priceTry: "", isOffer: false, priceBeforeUsd: "", priceBeforeSyp: "", priceBeforeTry: "" }];
  }
  return item.variants.map((v) => ({
    id: v.id,
    sizeEn: v.size_name_en,
    sizeAr: v.size_name_ar,
    priceUsd: v.price_usd != null ? v.price_usd.toString() : "",
    priceSyp: v.price_syp != null ? v.price_syp.toString() : "",
    priceTry: v.price_try != null ? v.price_try.toString() : "",
    isOffer: v.is_offer,
    priceBeforeUsd: v.price_before_usd?.toString() || "",
    priceBeforeSyp: v.price_before_syp?.toString() || "",
    priceBeforeTry: v.price_before_try?.toString() || "",
  }));
}

export default function EditItemForm({
  item,
  categories,
  locale,
}: {
  item: ItemData;
  categories: CategoryRow[];
  locale: string;
}) {
  const router = useRouter();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [nameEn, setNameEn] = useState(item.name_en);
  const [nameAr, setNameAr] = useState(item.name_ar);
  const [descEn, setDescEn] = useState(item.description_en);
  const [descAr, setDescAr] = useState(item.description_ar);
  const [categoryId, setCategoryId] = useState(item.category_id);
  const [isBestseller, setIsBestseller] = useState(item.is_bestseller);
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [variants, setVariantsState] = useState<Variant[]>(dataToVariants(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addVariant = () =>
    setVariantsState((prev) => [...prev, { id: crypto.randomUUID(), sizeEn: "", sizeAr: "", priceUsd: "", priceSyp: "", priceTry: "", isOffer: false, priceBeforeUsd: "", priceBeforeSyp: "", priceBeforeTry: "" }]);
  const removeVariant = (id: string) =>
    setVariantsState((prev) => (prev.length <= 1 ? prev : prev.filter((v) => v.id !== id)));
  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariantsState((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        if (field === "isOffer") return { ...v, isOffer: value === "true" };
        return { ...v, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const itemRes = await updateItem(item.id, {
        category_id: categoryId,
        name_en: nameEn,
        name_ar: nameAr,
        description_en: descEn || "",
        description_ar: descAr || "",
        image_url: imageUrl,
        is_bestseller: isBestseller,
      });

      if (!itemRes.success) {
        setError(itemRes.error ?? "Failed to update item");
        setSaving(false);
        return;
      }

      const variantInputs = variants
        .filter((v) => v.sizeEn.trim() && v.sizeAr.trim())
        .map((v) => ({
          item_id: item.id,
          size_name_en: v.sizeEn,
          size_name_ar: v.sizeAr,
          price_usd: v.priceUsd ? parseFloat(v.priceUsd) : null,
          price_syp: v.priceSyp ? parseInt(v.priceSyp, 10) : null,
          price_try: v.priceTry ? parseFloat(v.priceTry) : null,
          is_offer: v.isOffer,
          price_before_usd: v.isOffer ? (parseFloat(v.priceBeforeUsd) || null) : null,
          price_before_syp: v.isOffer ? (parseInt(v.priceBeforeSyp, 10) || null) : null,
          price_before_try: v.isOffer ? (parseFloat(v.priceBeforeTry) || null) : null,
        }));

      const varRes = await setVariants(item.id, variantInputs);
      if (!varRes.success) {
        setError(varRes.error ?? "Item updated but variant save failed");
        setSaving(false);
        return;
      }

      router.push("/admin/items");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-primary/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" className="rtl:hidden" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19l7-7-7-7" className="ltr:hidden" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-foreground">{t("Edit Item", "تعديل الصنف")}</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-error-bg border border-error-border text-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t("Basic Info", "معلومات أساسية")}</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("Name (English)", "الاسم (إنجليزي)")}</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("Name (Arabic)", "الاسم (عربي)")}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                required
                dir="rtl"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <ImageUpload currentUrl={item.image_url} onUpload={setImageUrl} locale={locale} />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("Description (English)", "الوصف (إنجليزي)")}</label>
              <textarea
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("Description (Arabic)", "الوصف (عربي)")}</label>
              <textarea
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                rows={3}
                dir="rtl"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("Category", "القسم")}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">{t("Select category", "اختر القسم")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-foreground">{t("Mark as bestseller", "وضع كأكثر طلباً")}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{t("Sizes & Prices", "المقاسات والأسعار")}</h3>
            <button
              type="button"
              onClick={addVariant}
              className="text-xs text-primary font-medium hover:underline"
            >
              + {t("Add size", "إضافة مقاس")}
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v) => (
              <div key={v.id} className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-background/50">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-muted mb-1">{t("Size (EN)", "المقاس (إنج)")}</label>
                  <input
                    type="text"
                    value={v.sizeEn}
                    onChange={(e) => updateVariant(v.id, "sizeEn", e.target.value)}
                    placeholder="Small / Medium / Large"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-muted mb-1">{t("Size (AR)", "المقاس (عربي)")}</label>
                  <input
                    type="text"
                    value={v.sizeAr}
                    onChange={(e) => updateVariant(v.id, "sizeAr", e.target.value)}
                    placeholder="صغير / وسط / كبير"
                    dir="rtl"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-muted mb-1">{t("Price (TL)", "السعر (TL)")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={v.priceTry}
                    onChange={(e) => updateVariant(v.id, "priceTry", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-muted mb-1">{t("Price (USD)", "السعر (USD)")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={v.priceUsd}
                    onChange={(e) => updateVariant(v.id, "priceUsd", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-muted mb-1">{t("Price (SYP)", "السعر (SYP)")}</label>
                  <input
                    type="number"
                    min="0"
                    value={v.priceSyp}
                    onChange={(e) => updateVariant(v.id, "priceSyp", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <label className="flex items-center gap-1.5 mb-0.5 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={v.isOffer}
                    onChange={(e) => updateVariant(v.id, "isOffer", e.target.checked ? "true" : "false")}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-[10px] text-muted whitespace-nowrap">{t("Offer", "عرض")}</span>
                </label>
                {v.isOffer && (
                  <>
                    <div className="w-20">
                      <label className="block text-[10px] text-muted mb-1">{t("Before TL", "قبل TL")}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.priceBeforeTry}
                        onChange={(e) => updateVariant(v.id, "priceBeforeTry", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-2 rounded-lg border border-border bg-white text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-[10px] text-muted mb-1">{t("Before USD", "قبل USD")}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.priceBeforeUsd}
                        onChange={(e) => updateVariant(v.id, "priceBeforeUsd", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-2 rounded-lg border border-border bg-white text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] text-muted mb-1">{t("Before SYP", "قبل SYP")}</label>
                      <input
                        type="number"
                        min="0"
                        value={v.priceBeforeSyp}
                        onChange={(e) => updateVariant(v.id, "priceBeforeSyp", e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-2 rounded-lg border border-border bg-white text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </>
                )}
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="p-2 rounded-lg text-muted hover:text-error hover:bg-error-bg transition-all mb-0.5"
                    title={t("Remove size", "حذف المقاس")}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {variants.length === 1 && <div className="w-9" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? t("Saving...", "جاري الحفظ...") : t("Save Changes", "حفظ التغييرات")}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-primary/5 active:scale-[0.98] transition-all"
          >
            {t("Cancel", "إلغاء")}
          </button>
        </div>
      </form>
    </div>
  );
}
