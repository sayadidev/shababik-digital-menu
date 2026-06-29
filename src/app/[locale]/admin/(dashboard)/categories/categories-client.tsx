"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { createCategory, updateCategory, deleteCategory, reorderCategories } from "@/lib/actions/category";

type Category = {
  id: string;
  name_en: string;
  name_ar: string;
  order_index: number;
  itemCount: number;
};

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function CreateButton() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
      >
        + {t(locale, "New Category", "قسم جديد")}
      </button>
      <CreateDialog open={open} onClose={() => setOpen(false)} locale={locale} />
    </>
  );
}

function EditButton({ category }: { category: Category }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all"
        title={t(locale, "Edit", "تعديل")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    );
  }
  return <EditDialog category={category} open={open} onClose={() => setOpen(false)} locale={locale} />;
}

function DeleteButton({ category }: { category: Category }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    const res = await deleteCategory(category.id);
    setDeleting(false);
    if (res.success) {
      setConfirm(false);
      router.refresh();
    } else {
      alert(res.error ?? t(locale, "Failed to delete", "فشل الحذف"));
    }
  }, [category.id, router, locale]);

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error-bg transition-all"
        title={t(locale, "Delete", "حذف")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-error font-medium">{t(locale, "Delete?", "حذف؟")}</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-error font-semibold hover:underline disabled:opacity-50"
      >
        {deleting ? "..." : t(locale, "Yes", "نعم")}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs text-muted hover:underline"
      >
        {t(locale, "No", "لا")}
      </button>
    </div>
  );
}

function CreateDialog({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: string }) {
  if (!open) return null;
  return <CategoryForm onClose={onClose} locale={locale} />;
}

function EditDialog({ category, open, onClose, locale }: { category: Category; open: boolean; onClose: () => void; locale: string }) {
  if (!open) return null;
  return <CategoryForm category={category} onClose={onClose} locale={locale} />;
}

function CategoryForm({ category, onClose, locale }: { category?: Category; onClose: () => void; locale: string }) {
  const [nameEn, setNameEn] = useState(category?.name_en ?? "");
  const [nameAr, setNameAr] = useState(category?.name_ar ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = category
      ? await updateCategory(category.id, { name_en: nameEn, name_ar: nameAr, order_index: category.order_index })
      : await createCategory({ name_en: nameEn, name_ar: nameAr, order_index: 0 });

    setSaving(false);

    if (res.success) {
      router.refresh();
      onClose();
    } else {
      setError(res.error ?? t(locale, "Operation failed", "فشلت العملية"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-4">
          {category ? t(locale, "Edit Category", "تعديل القسم") : t(locale, "New Category", "قسم جديد")}
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-bg border border-error-border text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t(locale, "Name (English)", "الاسم (إنجليزي)")}</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t(locale, "Name (Arabic)", "الاسم (عربي)")}</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              required
              dir="rtl"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {saving ? t(locale, "Saving...", "جاري الحفظ...") : category ? t(locale, "Save Changes", "حفظ التغييرات") : t(locale, "Create", "إنشاء")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-primary/5 active:scale-[0.98] transition-all"
            >
              {t(locale, "Cancel", "إلغاء")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DragHandle() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
    </svg>
  );
}

function CategoryList({ categories, locale: l }: { categories: Category[]; locale: string }) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);
  const touchStartY = useRef(0);
  const [list, setList] = useState(categories);
  const [reordering, setReordering] = useState(false);
  const [dragging, setDragging] = useState(-1);
  const [error, setError] = useState("");

  // Sync with server data after refresh/revalidation
  useEffect(() => {
    setList(categories);
  }, [categories]);

  // ── HTML5 DnD (desktop) ────────────────────
  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragEnter = (idx: number) => {
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    const updated = [...list];
    const [moved] = updated.splice(from, 1);
    updated.splice(idx, 0, moved);
    dragIdx.current = idx;
    setList(updated);
  };
  const handleDrop = async () => {
    dragIdx.current = null;
    setReordering(true);
    setError("");
    const res = await reorderCategories(list.map((c) => c.id));
    setReordering(false);
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error ?? t(l, "Reorder failed", "فشل إعادة الترتيب"));
      setList(categories);
    }
  };

  // ── Touch DnD (mobile) ─────────────────────
  const handleTouchStart = (idx: number, e: React.TouchEvent) => {
    dragIdx.current = idx;
    touchStartY.current = e.touches[0].clientY;
    setDragging(idx);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragIdx.current === null) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const itemEl = (el as HTMLElement).closest("[data-cat-idx]");
    if (!itemEl) return;
    const to = parseInt(itemEl.getAttribute("data-cat-idx") ?? "", 10);
    if (isNaN(to)) return;
    const from = dragIdx.current;
    if (from === to || from === null) return;
    const updated = [...list];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    dragIdx.current = to;
    setList(updated);
  };
  const handleTouchEnd = async () => {
    setDragging(-1);
    dragIdx.current = null;
    setReordering(true);
    setError("");
    const res = await reorderCategories(list.map((c) => c.id));
    setReordering(false);
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error ?? t(l, "Reorder failed", "فشل إعادة الترتيب"));
      setList(categories);
    }
  };

  return (
    <div ref={listRef} className="space-y-1">
      {error && (
        <div className="p-3 rounded-xl bg-error-bg border border-error-border text-sm text-error mb-2">
          {error}
        </div>
      )}
      {list.map((cat, idx) => (
        <div key={cat.id}
          data-cat-idx={idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onTouchStart={(e) => handleTouchStart(idx, e)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-shadow cursor-grab active:cursor-grabbing select-none ${
            reordering ? "pointer-events-none opacity-60" : ""
          } ${idx === dragging ? "shadow-lg bg-white relative z-10" : ""} ${idx !== dragging && idx % 2 === 0 ? "bg-white/40" : ""} hover:bg-primary/5`}
          style={{ touchAction: "none" }}>
          <span className="shrink-0 text-muted/40">
            <DragHandle />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{cat.name_en}</p>
            <p className="text-xs text-muted" dir="rtl">{cat.name_ar} · {cat.itemCount} {t(l, "items", "أصناف")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EditButton category={cat} />
            <DeleteButton category={cat} />
          </div>
        </div>
      ))}
      <div className="text-[11px] text-muted/50 text-center pt-1">
        {t(l, "Drag to reorder", "اسحب لإعادة الترتيب")}
      </div>
    </div>
  );
}

export { CreateButton, EditButton, DeleteButton, CreateDialog, EditDialog, CategoryList };
