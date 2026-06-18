"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { CategoryRow } from "@/lib/validations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name_en: string; name_ar: string }) => Promise<void>;
  category?: CategoryRow | null;
};

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
}: Props) {
  const t = useTranslations("admin");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNameEn(category?.name_en || "");
      setNameAr(category?.name_ar || "");
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name_en: nameEn.trim(), name_ar: nameAr.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog className="modal modal-open" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">
          {category ? t("editCategory") : t("addCategory")}
        </h3>
        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset">
            <label className="fieldset-label">{t("categoryNameEn")}</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              className="input input-bordered w-full"
            />
          </fieldset>
          <fieldset className="fieldset mt-4">
            <label className="fieldset-label">{t("categoryNameAr")}</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              required
              dir="rtl"
              className="input input-bordered w-full"
            />
          </fieldset>
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-ghost"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? <span className="loading loading-spinner" /> : t("save")}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
