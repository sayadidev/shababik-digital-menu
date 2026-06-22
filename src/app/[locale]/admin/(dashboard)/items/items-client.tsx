"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toggleActive, setOfferPosition, deleteItem } from "@/lib/actions/item";

type ItemRow = {
  id: string;
  name_en: string;
  name_ar: string;
  is_active: boolean;
  is_offer: boolean;
  offer_position: number | null;
};

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function ToggleButton({ item }: { item: ItemRow }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [toggling, setToggling] = useState(false);
  const router = useRouter();

  const handleToggle = useCallback(async () => {
    setToggling(true);
    const res = await toggleActive(item.id, !item.is_active);
    setToggling(false);
    if (res.success) router.refresh();
  }, [item.id, item.is_active, router]);

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      role="switch"
      aria-checked={item.is_active}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        item.is_active ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-all duration-300 ${
          item.is_active
            ? "ltr:translate-x-[22px] rtl:-translate-x-[22px]"
            : "ltr:translate-x-[2px] rtl:-translate-x-[2px]"
        }`}
      />
    </button>
  );
}

const POSITIONS = [
  { value: null, label: "—", labelAr: "—" },
  { value: 1, label: "Left", labelAr: "يسار" },
  { value: 2, label: "Center", labelAr: "وسط" },
  { value: 3, label: "Right", labelAr: "يمين" },
];

function OfferPositionSelect({ item }: { item: ItemRow }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "" ? null : Number(e.target.value);
    setSaving(true);
    const res = await setOfferPosition(item.id, val);
    setSaving(false);
    if (res.success) router.refresh();
  }, [item.id, router]);

  return (
    <select
      value={item.offer_position ?? ""}
      onChange={handleChange}
      disabled={saving}
      className={`px-1.5 py-0.5 text-[11px] font-medium rounded-md border cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50 ${
        item.offer_position
          ? "bg-accent/20 text-foreground border-accent/40"
          : "bg-transparent text-muted border-border"
      }`}
      style={{ minWidth: "70px" }}
      title={t(locale, "Hero position", "موقع في الهيرو")}
    >
      {POSITIONS.map((p) => (
        <option key={p.value ?? ""} value={p.value ?? ""}>
          {locale === "ar" ? p.labelAr : p.label}
        </option>
      ))}
    </select>
  );
}

function DeleteButton({ item }: { item: ItemRow }) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    const res = await deleteItem(item.id);
    setDeleting(false);
    if (res.success) {
      setConfirm(false);
      router.refresh();
    } else {
      alert(res.error ?? t(locale, "Failed to delete", "فشل الحذف"));
    }
  }, [item.id, router, locale]);

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

export { ToggleButton, OfferPositionSelect, DeleteButton };
