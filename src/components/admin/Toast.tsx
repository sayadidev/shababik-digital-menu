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
    <div
      role="alert"
      className={`fixed end-4 top-4 z-[100] rounded-lg px-6 py-3 text-white shadow-lg ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
      style={{ animation: "toast-slide-in 0.3s ease-out" }}
    >
      {message}
      <style>{`@keyframes toast-slide-in{from{opacity:0;transform:translateY(-0.5rem) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}
