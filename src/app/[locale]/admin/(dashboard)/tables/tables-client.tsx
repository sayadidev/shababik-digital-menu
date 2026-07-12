"use client";

import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createTable, deleteTable } from "@/lib/actions/tables";
import type { Table } from "@/types/database";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function TablesClient({
  tables: initialTables,
  locale,
}: {
  tables: Table[];
  locale: string;
}) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const isRtl = locale === "ar";

  const handleAdd = async () => {
    const trimmed = newTableNumber.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);
    const result = await createTable(trimmed);
    if (result.success && result.table) {
      setTables((prev) => [...prev, result.table!]);
      setNewTableNumber("");
    } else {
      setError(result.error || t("Failed to add table", "فشل إضافة الطاولة"));
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setDeleting(id);
    setError(null);
    const result = await deleteTable(id);
    if (result.success) {
      setTables((prev) => prev.filter((tbl) => tbl.id !== id));
    } else {
      setError(result.error || t("Failed to delete table", "فشل حذف الطاولة"));
    }
    setDeleting(null);
  };

  const handlePrintOne = useCallback((id: string) => {
    setPrintingId(id);
    requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  const qrUrl = (token: string) => `${SITE_URL}/${locale}/?t=${token}`;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-card {
            display: none !important;
          }
          .print-card.print-target {
            display: flex !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            align-items: center !important;
            justify-content: center !important;
            background: black !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .no-print, .print-card .table-label,
          .print-card .table-token, .print-card .print-url,
          .print-card .card-bg, .print-card .card-actions {
            display: none !important;
          }
          .print-card .qr-wrapper {
            border: none !important;
            background: black !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card .qr-wrapper svg {
            width: 88vmin !important;
            height: 88vmin !important;
            max-width: 88vmin !important;
          }
          .print-card .qr-size-safe {
            width: 85vmin !important;
            height: 85vmin !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <h1 className="text-lg font-bold text-foreground">
          {t("Table Management", "إدارة الطاولات")}
        </h1>
      </div>

      <div className="bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] p-4 no-print">
        <div className="flex items-end gap-3" dir={isRtl ? "rtl" : "ltr"}>
          <div className="flex-1">
            <label htmlFor="table-number" className="block text-xs font-semibold text-muted mb-2">
              {t("Table Number", "رقم الطاولة")}
            </label>
            <input
              id="table-number"
              type="text"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder={t("e.g. 1, A1, 2B", "مثال: 1, A1, 2B")}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-border text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !newTableNumber.trim()}
            className="shrink-0 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {adding ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              t("Add Table", "إضافة طاولة")
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      <div id="print-area">
        {tables.length === 0 ? (
          <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] no-print">
            <p className="text-muted text-sm">
              {t("No tables yet. Add your first table above.", "لا توجد طاولات بعد. أضف الطاولة الأولى أعلاه.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`print-card ${printingId === table.id ? "print-target" : ""} bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] p-5 flex flex-col items-center gap-3`}
                style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
              >
                <div className="qr-wrapper rounded-xl p-3" style={{ backgroundColor: "#000", border: "1px solid #333" }}>
                  <QRCodeSVG
                    value={qrUrl(table.secure_token)}
                    size={180}
                    level="M"
                    fgColor="#ffffff"
                    bgColor="#000000"
                    style={{ width: "100%", height: "auto", maxWidth: "180px" }}
                  />
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="table-label text-xl font-bold" style={{ color: "#3B2818" }}>
                    {t("Table", "طاولة")} {table.table_number}
                  </span>
                  <span className="table-token text-[10px] text-muted font-mono truncate max-w-[200px]">
                    {table.secure_token}
                  </span>
                </div>

                <div className="card-actions flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handlePrintOne(table.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.97] transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {t("Print QR", "طباعة QR")}
                  </button>
                  {confirmDeleteId === table.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(table.id)}
                        disabled={deleting === table.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {deleting === table.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          t("Confirm", "تأكيد")
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:bg-black/5 active:scale-[0.97] transition-all"
                      >
                        {t("Cancel", "إلغاء")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(table.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 active:scale-[0.97] transition-all flex items-center gap-1.5 border border-transparent hover:border-red-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t("Delete", "حذف")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
