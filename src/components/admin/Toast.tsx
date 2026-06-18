"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast toast-end toast-top z-[100]">
      <div
        className={`alert ${type === "success" ? "alert-success" : "alert-error"} shadow-lg`}
      >
        <span>{message}</span>
      </div>
    </div>
  );
}
