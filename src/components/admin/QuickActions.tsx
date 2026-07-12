"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function QuickActions({ locale }: { locale: string }) {
  const router = useRouter();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableInput, setTableInput] = useState("");
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("orders").select("*").eq("status", "pending").then(({ data }) => {
      setPendingCount(data?.length ?? 0);
    });
    const today = new Date().toISOString().split("T")[0];
    supabase.from("orders").select("id").eq("status", "completed").gte("completed_at", `${today}T00:00:00Z`).lte("completed_at", `${today}T23:59:59Z`).then(({ data }) => {
      setCompletedCount(data?.length ?? 0);
    });
  }, []);

  const handleStaffOrder = () => {
    const trimmed = tableInput.trim();
    if (trimmed) {
      setShowTableModal(false);
      setTableInput("");
      router.push(`/?table=${encodeURIComponent(trimmed)}&role=staff`);
    }
  };

  return (
    <>
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <h3 className="text-sm font-bold text-foreground mb-4">{t("Quick Overview", "نظرة سريعة")}</h3>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#f5efdf" }}>
            <p className="text-xs text-muted mb-0.5">{t("Pending Orders", "قيد الانتظار")}</p>
            <p className="text-xl font-bold" style={{ color: "#d4a017" }}>
              {pendingCount !== null ? pendingCount : "—"}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#f5efdf" }}>
            <p className="text-xs text-muted mb-0.5">{t("Completed Today", "مكتمل اليوم")}</p>
            <p className="text-xl font-bold" style={{ color: "#5a8a3a" }}>
              {completedCount !== null ? completedCount : "—"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border-0"
            style={{ backgroundColor: "#9a6a3a", color: "#fff" }}
          >
            {t("New Order (Staff)", "طلب جديد (للموظفين)")}
          </button>
          <a
            href={`/${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98]"
            style={{ backgroundColor: `${"#9a6a3a"}10`, color: "#9a6a3a" }}
          >
            {t("View Menu", "مشاهدة القائمة")} →
          </a>
        </div>
      </div>

      {/* ── Table Number Modal ── */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTableModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ animation: "scaleIn 0.2s ease-out" }}>
            <h2 className="text-base font-bold text-foreground mb-1">{t("Enter Table", "أدخل الطاولة")}</h2>
            <p className="text-xs text-muted mb-5">{t("Staff order entry — select the customer's table", "طلب مساعدة من الموظفين — اختر طاولة العميل")}</p>

            <input
              type="text"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleStaffOrder(); }}
              placeholder={t("Table...", "الطاولة...")}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground text-sm text-center font-bold tracking-widest placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all mb-4"
            />

            <div className="flex items-center gap-2">
              <button type="button" onClick={handleStaffOrder}
                disabled={!tableInput.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border-0 disabled:opacity-40"
                style={{ backgroundColor: "#9a6a3a", color: "#fff" }}>
                {t("Start Order", "بدء الطلب")}
              </button>
              <button type="button" onClick={() => { setShowTableModal(false); setTableInput(""); }}
                className="px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-primary/5 transition-all">
                {t("Cancel", "إلغاء")}
              </button>
            </div>
          </div>
          <style>{`@keyframes scaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </>
  );
}
