"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { createItem, updateItem } from "@/lib/actions/item";
import { setVariants } from "@/lib/actions/item-variant";
import Toast from "@/components/admin/Toast";
import imageCompression from "browser-image-compression";
import type { CategoryRow, ItemRow, ItemVariantRow } from "@/lib/validations";

type Props = {
  categories: CategoryRow[];
  initialData?: ItemRow & { variants: ItemVariantRow[] };
};

type VariantEntry = {
  size_name_en: string;
  size_name_ar: string;
  price_usd: string;
  price_syp: string;
};

function emptyVariant(): VariantEntry {
  return { size_name_en: "", size_name_ar: "", price_usd: "", price_syp: "" };
}

export default function ItemForm({ categories, initialData }: Props) {
  const isEdit = !!initialData;
  const t = useTranslations("admin");
  const router = useRouter();

  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [nameEn, setNameEn] = useState(initialData?.name_en ?? "");
  const [nameAr, setNameAr] = useState(initialData?.name_ar ?? "");
  const [descEn, setDescEn] = useState(initialData?.description_en ?? "");
  const [descAr, setDescAr] = useState(initialData?.description_ar ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? "");
  const [imageUploading, setImageUploading] = useState(false);
  const [variants, setVariantsState] = useState<VariantEntry[]>(
    initialData?.variants?.length
      ? initialData.variants.map((v) => ({
          size_name_en: v.size_name_en,
          size_name_ar: v.size_name_ar,
          price_usd: String(v.price_usd),
          price_syp: String(v.price_syp),
        }))
      : [emptyVariant()],
  );
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const addVariant = () =>
    setVariantsState((prev) => [...prev, emptyVariant()]);
  const removeVariant = (idx: number) =>
    setVariantsState((prev) => prev.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, field: keyof VariantEntry, value: string) =>
    setVariantsState((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 800,
        initialQuality: 0.7,
        maxSizeMB: 0.3,
        useWebWorker: true,
      });
      const suffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${Date.now()}_${suffix}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("item-images")
        .upload(fileName, compressed, { upsert: true });
      if (error) {
        setToast({
          message: `${t("uploadImage")}: ${error.message}`,
          type: "error",
        });
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("item-images").getPublicUrl(fileName);
      setImageUrl(publicUrl);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Upload failed",
        type: "error",
      });
    } finally {
      setImageUploading(false);
    }
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const fieldErrors: string[] = [];
    if (!categoryId) fieldErrors.push(t("category"));
    if (!nameEn.trim()) fieldErrors.push(t("itemNameEn"));
    if (!nameAr.trim()) fieldErrors.push(t("itemNameAr"));

    const validVariants = variants.filter(
      (v) => v.size_name_en.trim() || v.size_name_ar.trim(),
    );
    for (let i = 0; i < validVariants.length; i++) {
      const v = validVariants[i];
      if (!v.size_name_en.trim()) fieldErrors.push(`${t("variantSizeEn")} #${i + 1}`);
      if (!v.size_name_ar.trim()) fieldErrors.push(`${t("variantSizeAr")} #${i + 1}`);
      if (v.price_usd === "" || isNaN(parseFloat(v.price_usd)) || parseFloat(v.price_usd) < 0)
        fieldErrors.push(`${t("priceUsd")} #${i + 1}`);
      if (v.price_syp === "" || isNaN(parseInt(v.price_syp, 10)) || parseInt(v.price_syp, 10) < 0)
        fieldErrors.push(`${t("priceSyp")} #${i + 1}`);
    }

    if (fieldErrors.length > 0) {
      setToast({ message: fieldErrors.join(", "), type: "error" });
      setSubmitting(false);
      return;
    }

    try {
      const itemData = {
        category_id: categoryId,
        name_en: nameEn.trim(),
        name_ar: nameAr.trim(),
        description_en: descEn.trim(),
        description_ar: descAr.trim(),
        image_url: imageUrl,
        is_active: initialData?.is_active ?? true,
        is_bestseller: initialData?.is_bestseller ?? false,
        view_count: initialData?.view_count ?? 0,
      };

      if (isEdit && initialData) {
        const result = await updateItem(initialData.id, itemData);
        if (!result.success) throw new Error(result.error);
        if (validVariants.length > 0) {
          const vResult = await setVariants(
            initialData.id,
            validVariants.map((v) => ({
              item_id: initialData.id,
              size_name_en: v.size_name_en.trim(),
              size_name_ar: v.size_name_ar.trim(),
              price_usd: parseFloat(v.price_usd),
              price_syp: parseInt(v.price_syp, 10),
            })),
          );
          if (!vResult.success) throw new Error(vResult.error);
        }
      } else {
        const result = await createItem(itemData);
        if (!result.success) throw new Error(result.error);
        const newId = result.data!.id;
        if (validVariants.length > 0) {
          const vResult = await setVariants(
            newId,
            validVariants.map((v) => ({
              item_id: newId,
              size_name_en: v.size_name_en.trim(),
              size_name_ar: v.size_name_ar.trim(),
              price_usd: parseFloat(v.price_usd),
              price_syp: parseInt(v.price_syp, 10),
            })),
          );
          if (!vResult.success) throw new Error(vResult.error);
        }
      }

      setToast({ message: t("saveSuccess"), type: "success" });
      setTimeout(() => router.push("/admin/items"), 800);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Error saving item",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="mb-8 text-2xl font-bold text-foreground">
        {isEdit ? t("editItem") : t("addItem")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("category")}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="">--</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_en} / {cat.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("itemNameEn")}
              </label>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("itemNameAr")}
              </label>
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("descriptionEn")}
              </label>
              <textarea
                rows={3}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("descriptionAr")}
              </label>
              <textarea
                rows={3}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Image Upload */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t("image")}
          </h2>

          <div className="flex items-start gap-4">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {imageUploading ? t("uploading") : t("uploadImage")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="hidden"
                />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="ms-3 text-sm text-red-500 hover:text-red-700"
                >
                  {t("delete")}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Sizes / Prices */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Sizes / Prices
          </h2>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t("variantSizeEn")}
                  </label>
                  <input
                    value={v.size_name_en}
                    onChange={(e) => updateVariant(idx, "size_name_en", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t("variantSizeAr")}
                  </label>
                  <input
                    value={v.size_name_ar}
                    onChange={(e) => updateVariant(idx, "size_name_ar", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t("priceUsd")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={v.price_usd}
                    onChange={(e) => updateVariant(idx, "price_usd", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t("priceSyp")}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={v.price_syp}
                    onChange={(e) => updateVariant(idx, "price_syp", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  disabled={variants.length === 1}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-30"
                >
                  {t("removeVariant")}
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-brand hover:text-brand-dark"
          >
            {t("addVariant")}
          </button>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/items")}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand px-6 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting ? "..." : t("save")}
          </button>
        </div>
      </form>
    </>
  );
}
