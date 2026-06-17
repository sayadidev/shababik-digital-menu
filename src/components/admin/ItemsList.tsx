"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  toggleActive,
  toggleBestseller,
  deleteItem,
} from "@/lib/actions/item";
import Toast from "@/components/admin/Toast";
import type { CategoryRow, ItemRow } from "@/lib/validations";

type ItemWithCategory = ItemRow & {
  category_name_en: string;
  category_name_ar: string;
};

type Props = {
  items: ItemWithCategory[];
  categories: CategoryRow[];
};

export default function ItemsList({ items, categories }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.name_en.toLowerCase().includes(q) ||
      item.name_ar.includes(q);
    const matchesCategory =
      !categoryFilter || item.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggle = async (
    id: string,
    action: typeof toggleActive | typeof toggleBestseller,
  ) => {
    const result = await action(id);
    if (result.success) {
      router.refresh();
    } else {
      setToast({ message: result.error || "Error", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteItem(id);
    if (result.success) {
      setToast({ message: t("deleteSuccess"), type: "success" });
      setDeleting(null);
      router.refresh();
    } else {
      setToast({ message: result.error || "Error", type: "error" });
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("items")}</h1>
        <Link
          href="/admin/items/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          {t("addItem")}
        </Link>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand focus:outline-none sm:w-64"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand focus:outline-none sm:w-48"
        >
          <option value="">{t("filterCategory")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_en} / {cat.name_ar}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <th className="px-4 py-3">{t("image")}</th>
              <th className="px-4 py-3">{t("itemNameEn")}</th>
              <th className="px-4 py-3">{t("category")}</th>
              <th className="px-4 py-3">{t("inStock")}</th>
              <th className="px-4 py-3">{t("bestseller")}</th>
              <th className="px-4 py-3">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name_en}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  {item.name_en}
                  <br />
                  <span className="text-xs text-gray-500">{item.name_ar}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {item.category_name_en}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id, toggleActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                    aria-label={item.is_active ? t("inStock") : t("outOfStock")}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id, toggleBestseller)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.is_bestseller ? "bg-brand" : "bg-gray-300"
                    }`}
                    aria-label={t("bestseller")}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.is_bestseller ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/items/${item.id}/edit`}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:bg-brand-light"
                    >
                      {t("editItem")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleting(item.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {t("noItems")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name_en}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.name_en}</p>
                <p className="text-xs text-gray-500">{item.name_ar}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.category_name_en}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span>{t("inStock")}</span>
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, toggleActive)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    item.is_active ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      item.is_active ? "translate-x-[18px]" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span>{t("bestseller")}</span>
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, toggleBestseller)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    item.is_bestseller ? "bg-brand" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      item.is_bestseller ? "translate-x-[18px]" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href={`/admin/items/${item.id}/edit`}
                className="flex-1 rounded-lg bg-brand-light px-3 py-2 text-center text-xs font-medium text-brand-dark transition hover:bg-brand/20"
              >
                {t("editItem")}
              </Link>
              <button
                type="button"
                onClick={() => setDeleting(item.id)}
                className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            {t("noItems")}
          </div>
        )}
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              {t("deleteItem")}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{t("confirmDelete")}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleting)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
