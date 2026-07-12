"use client";

import { useRouter } from "next/navigation";

type Props = {
  locale: string;
  featureNameEn: string;
  featureNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
};

export default function ProLockedScreen({
  locale,
  featureNameEn,
  featureNameAr,
  descriptionEn,
  descriptionAr,
}: Props) {
  const router = useRouter();
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <div className="bg-surface rounded-2xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_8px_32px_rgba(212,196,176,0.15)] p-8 md:p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#f5efdf" }}>
          <svg className="w-10 h-10" style={{ color: "#9a6a3a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ backgroundColor: "#9a6a3a18", color: "#9a6a3a" }}>
          {t("Pro Feature", "ميزة احترافية")}
        </span>

        <h2 className="text-xl font-bold mb-2" style={{ color: "#3B2818" }}>
          {t(featureNameEn, featureNameAr)}
        </h2>

        <p className="text-sm leading-relaxed mb-8" style={{ color: "#8a7a6a" }}>
          {t(descriptionEn, descriptionAr)}
        </p>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/settings`)}
          className="w-full px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border-0 inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: "#9a6a3a", color: "#fff" }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          {t("Upgrade to Pro — Go to Settings", "ترقية الباقة — الذهاب للإعدادات")}
        </button>
      </div>
    </div>
  );
}