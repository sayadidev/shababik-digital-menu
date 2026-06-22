"use client";

import { useState, useRef } from "react";
import { uploadItemImage } from "@/lib/upload-image";

function checkImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

type Props = {
  currentUrl?: string;
  onUpload: (url: string) => void;
  locale?: string;
};

function t(locale: string | undefined, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export default function ImageUpload({ currentUrl, onUpload, locale }: Props) {
  const [preview, setPreview] = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t(locale, "Please select an image file", "يرجى اختيار ملف صورة"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t(locale, "Image must be under 10MB", "يجب أن يكون حجم الصورة أقل من 10 ميجابايت"));
      return;
    }

    const dims = await checkImageDimensions(file);
    if (dims) {
      if (dims.width < 400 || dims.height < 300) {
        setError(t(locale, "Image must be at least 400×300px", "يجب أن لا تقل أبعاد الصورة عن 400×300 بكسل"));
        return;
      }
    }

    setUploading(true);
    setError("");

    try {
      const url = await uploadItemImage(file);
      setPreview(url);
      onUpload(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "Upload failed", "فشل الرفع"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground mb-1">
        {t(locale, "Image", "الصورة")}
      </label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-white cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
        style={{ minHeight: 160 }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <svg className="w-8 h-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-muted">{t(locale, "Uploading...", "جاري الرفع...")}</span>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover max-h-48" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview("");
                onUpload("");
              }}
              className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all text-xs"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-muted">{t(locale, "Click to upload image", "انقر لرفع صورة")}</span>
            <span className="text-[11px] text-muted/60">{t(locale, "Max 10MB · Auto-compressed", "10 ميجابايت كحد أقصى · ضغط تلقائي")}</span>
            <span className="text-[10px] text-muted/40">{t(locale, "Recommended: 1200×900px · 4:3 ratio", "يُفضل: 1200×900 بكسل · نسبة 4:3")}</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
