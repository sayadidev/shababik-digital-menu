"use client";

import { useState, useCallback } from "react";
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
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [optimistic, setOptimistic] = useState<
    Record<string, { is_active?: boolean; is_bestseller?: boolean }>
  >({});

  const getItem = useCallback(
    (id: string) => {
      const o = optimistic[id];
      const item = items.find((i) => i.id === id)!;
      return {
        ...item,
        is_active: o?.is_active ?? item.is_active,
        is_bestseller: o?.is_bestseller ?? item.is_bestseller,
      };
    },
    [items, optimistic],
  );

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
    field: "is_active" | "is_bestseller",
    currentValue: boolean,
  ) => {
    setToggling((prev) => new Set(prev).add(id));
    setOptimistic((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: !currentValue },
    }));

    const action =
      field === "is_active" ? toggleActive : toggleBestseller;
    const result = await action(id, !currentValue);

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (!result.success) {
      setOptimistic((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: currentValue },
      }));
      setToast({ message: result.error || "Error", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(null);
    const result = await deleteItem(id);
    if (result.success) {
      setToast({ message: t("deleteSuccess"), type: "success" });
      router.refresh();
    } else {
      setToast({ message: result.error || "Error", type: "error" });
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("items")}</h1>
        <Link
          href="/admin/items/new"
          className="btn btn-primary"
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
          className="input input-bordered w-full sm:w-64"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="select select-bordered w-full sm:w-48"
        >
          <option value="">{t("filterCategory")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_en} / {cat.name_ar}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="table w-full">
          <thead>
            <tr>
              <th>{t("image")}</th>
              <th>{t("itemNameEn")}</th>
              <th>{t("category")}</th>
              <th>{t("inStock")}</th>
              <th>{t("bestseller")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-base-200">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name_en}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-base-300">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="font-medium">{item.name_en}</div>
                  <div className="text-xs text-muted">{item.name_ar}</div>
                </td>
                <td className="text-muted">{item.category_name_en}</td>
                <td>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={getItem(item.id).is_active}
                    onChange={() => handleToggle(item.id, "is_active", getItem(item.id).is_active)}
                    disabled={toggling.has(item.id)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={getItem(item.id).is_bestseller}
                    onChange={() => handleToggle(item.id, "is_bestseller", getItem(item.id).is_bestseller)}
                    disabled={toggling.has(item.id)}
                  />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/items/${item.id}/edit`}
                      className="btn btn-soft btn-sm"
                    >
                      {t("editItem")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleting(item.id)}
                      className="btn btn-soft btn-error btn-sm"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-8">
                  {t("noItems")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {filtered.map((item) => (
          <div key={item.id} className="card card-border border-border bg-base-100">
            <div className="card-body p-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-base-200">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name_en}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base-300">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-base-content">{item.name_en}</p>
                  <p className="text-xs text-muted">{item.name_ar}</p>
                  <p className="mt-1 text-xs text-muted">{item.category_name_en}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
                <label className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span>{t("inStock")}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={getItem(item.id).is_active}
                    onChange={() => handleToggle(item.id, "is_active", getItem(item.id).is_active)}
                    disabled={toggling.has(item.id)}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span>{t("bestseller")}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={getItem(item.id).is_bestseller}
                    onChange={() => handleToggle(item.id, "is_bestseller", getItem(item.id).is_bestseller)}
                    disabled={toggling.has(item.id)}
                  />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/admin/items/${item.id}/edit`}
                  className="btn btn-soft btn-sm flex-1"
                >
                  {t("editItem")}
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleting(item.id)}
                  className="btn btn-soft btn-error btn-sm flex-1"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card card-border border-base-300 bg-base-200 p-8 text-center text-muted">
            {t("noItems")}
          </div>
        )}
      </div>

      <dialog className={`modal ${deleting ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">{t("deleteItem")}</h3>
          <p className="text-sm">{t("confirmDelete")}</p>
          <div className="modal-action">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="btn btn-ghost"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(deleting!)}
              className="btn btn-error"
            >
              {t("delete")}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setDeleting(null)}>close</button>
        </form>
      </dialog>
    </div>
  );
}
