"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean;
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("admin");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-6 text-sm text-foreground">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
