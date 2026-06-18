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
    <dialog className="modal modal-open" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm">{message}</p>
        <div className="modal-action">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="btn btn-ghost"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="btn btn-error"
          >
            {submitting ? <span className="loading loading-spinner" /> : t("delete")}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
}
