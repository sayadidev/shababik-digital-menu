"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/lib/actions/category";
import type { CategoryRow } from "@/lib/validations";
import CategoryFormModal from "./category-form";
import ConfirmDialog from "./confirm-dialog";
import Toast from "@/components/admin/Toast";

type Props = {
  categories: CategoryRow[];
};

export default function CategoriesClient({ categories: initialCategories }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const openAddForm = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category: CategoryRow) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleFormSubmit = async (data: { name_en: string; name_ar: string }) => {
    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, data);
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id ? { ...c, ...data } : c,
          ),
        );
        showToast(t("saveSuccess"), "success");
        closeForm();
        router.refresh();
      } else {
        showToast(result.error || "Error", "error");
      }
    } else {
      const result = await createCategory({
        ...data,
        order_index: categories.length,
      });
      if (result.success && result.data) {
        const newCategory = result.data;
        setCategories((prev) => [...prev, newCategory]);
        showToast(t("saveSuccess"), "success");
        closeForm();
        router.refresh();
      } else {
        showToast(result.error || "Error", "error");
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    const result = await deleteCategory(id);
    if (result.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast(t("deleteSuccess"), "success");
      router.refresh();
    } else {
      showToast(result.error || "Error", "error");
    }
  };

  const moveCategory = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === categories.length - 1) return;

    const prev = [...categories];
    const next = [...categories];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setCategories(next);

    const ids = next.map((c) => c.id);
    const result = await reorderCategories(ids);
    if (result.success) {
      showToast(t("saveSuccess"), "success");
      router.refresh();
    } else {
      setCategories(prev);
      showToast(result.error || "Error", "error");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("categories")}</h1>
        <button
          onClick={openAddForm}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          + {t("addCategory")}
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="py-12 text-center text-muted">{t("noCategories")}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-muted">{t("order")}</th>
                  <th className="px-4 py-3 font-medium text-muted">{t("categoryNameEn")}</th>
                  <th className="px-4 py-3 font-medium text-muted">{t("categoryNameAr")}</th>
                  <th className="px-4 py-3 font-medium text-muted">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, i) => (
                  <tr key={cat.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-6 text-center text-muted">{i + 1}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveCategory(i, "up")}
                            disabled={i === 0}
                            className="leading-none text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Move up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveCategory(i, "down")}
                            disabled={i === categories.length - 1}
                            className="leading-none text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Move down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{cat.name_en}</td>
                    <td className="px-4 py-3 font-medium">{cat.name_ar}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(cat)}
                          className="rounded-md bg-brand-light px-3 py-1.5 text-sm font-medium text-brand-dark transition-colors hover:bg-brand hover:text-white"
                        >
                          {t("editCategory")}
                        </button>
                        <button
                          onClick={() => setDeletingId(cat.id)}
                          className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                        >
                          {t("deleteCategory")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {categories.map((cat, i) => (
              <div key={cat.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">#{i + 1}</span>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => moveCategory(i, "up")}
                        disabled={i === 0}
                        className="text-xs text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveCategory(i, "down")}
                        disabled={i === categories.length - 1}
                        className="text-xs text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(cat)}
                      className="rounded-md bg-brand-light px-3 py-1.5 text-sm font-medium text-brand-dark transition-colors hover:bg-brand hover:text-white"
                    >
                      {t("editCategory")}
                    </button>
                    <button
                      onClick={() => setDeletingId(cat.id)}
                      className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                      {t("deleteCategory")}
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-muted">{t("categoryNameEn")}:</span>{" "}
                    {cat.name_en}
                  </p>
                  <p>
                    <span className="text-muted">{t("categoryNameAr")}:</span>{" "}
                    {cat.name_ar}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        category={editingCategory}
      />

      <ConfirmDialog
        isOpen={deletingId !== null}
        message={t("confirmDelete")}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
