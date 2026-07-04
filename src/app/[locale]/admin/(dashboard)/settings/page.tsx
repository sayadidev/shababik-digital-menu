"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSettings, updateSettings } from "@/lib/actions/settings";
import { resetAnalytics } from "@/lib/actions/reset-analytics";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import type { SiteSettingsRow } from "@/lib/validations";

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);

  const [settings, setSettings] = useState<SiteSettingsRow | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroLogoUrl, setHeroLogoUrl] = useState("");
  const [headerLogoUrl, setHeaderLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Reset analytics dialog ─────────────
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  // ── Ordering feature toggle ──────────
  const [tierStatus, setTierState] = useState<"basic" | "pro">("basic");
  const [orderingEnabled, setOrderingState] = useState(false);
  const [enableUsd, setEnableUsd] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setSettings(s);
        setHeroImageUrl(s.hero_image_url || "");
        setHeroLogoUrl(s.hero_logo_url || "");
        setHeaderLogoUrl(s.header_logo_url || "");
        setTierState((s as any).tier ?? "basic");
        setOrderingState((s as any).ordering_enabled ?? false);
        setEnableUsd((s as any).enable_usd ?? true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await updateSettings({
        hero_image_url: heroImageUrl,
        hero_logo_url: heroLogoUrl,
        header_logo_url: headerLogoUrl,
        tier: tierStatus,
        ordering_enabled: orderingEnabled,
        enable_usd: enableUsd,
      });

      if (res.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(res.error ?? t("Failed to save settings", "فشل حفظ الإعدادات"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("An unexpected error occurred", "حدث خطأ غير متوقع"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const handleResetAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetting(true);

    try {
      const res = await resetAnalytics(resetEmail, resetPassword);
      if (res.success) {
        setShowResetDialog(false);
        setResetEmail("");
        setResetPassword("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      } else {
        setResetError(res.error ?? t("Reset failed", "فشل إعادة التعيين"));
      }
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-primary/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" className="rtl:hidden" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19l7-7-7-7" className="ltr:hidden" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-foreground">{t("Site Settings", "إعدادات الموقع")}</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-error-bg border border-error-border text-sm text-error">{error}</div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {t("Settings saved successfully!", "تم حفظ الإعدادات بنجاح!")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Hero Background ──────────────────── */}
        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t("Hero Background Image", "صورة خلفية الهيرو")}
          </h3>
          <ImageUpload currentUrl={heroImageUrl} onUpload={setHeroImageUrl} locale={locale} />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1.5" dir="ltr">
            <p className="font-semibold text-amber-900">{t("Image Requirements", "متطلبات الصورة")}:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{t("Format: JPEG, PNG, or WebP", "التنسيق: JPEG، PNG، أو WebP")}</li>
              <li>{t("Maximum size: 10MB", "الحد الأقصى للحجم: 10 ميغابايت")}</li>
              <li>{t("Recommended dimensions: 1440×900px or larger (16:9 landscape)", "الأبعاد الموصى بها: 1440×900 بكسل أو أكبر (16:9 أفقي)")}</li>
              <li>{t("Auto-compressed to WebP at 80% quality", "ضغط تلقائي إلى WebP بجودة 80%")}</li>
              <li>{t("A high-quality cafe/ambiance photo works best — avoid text-heavy images", "صورة كافية عالية الجودة هي الأفضل — تجنب الصور المليئة بالنصوص")}</li>
            </ul>
          </div>
        </div>

        {/* ── Logo Images ──────────────────────── */}
        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t("Logo Images", "صور الشعار")}</h3>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("Hero Logo (large, centered in hero)", "شعار الهيرو (كبير، في وسط الهيرو)")}
            </label>
            <ImageUpload currentUrl={heroLogoUrl} onUpload={setHeroLogoUrl} locale={locale} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("Header & Footer Logo (small, in sticky header and footer)", "شعار الرأس والتذييل (صغير، في الرأس الثابت والتذييل)")}
            </label>
            <ImageUpload currentUrl={headerLogoUrl} onUpload={setHeaderLogoUrl} locale={locale} />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1.5" dir="ltr">
            <p className="font-semibold text-amber-900">{t("Logo Requirements", "متطلبات الشعار")}:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{t("Format: PNG with transparency, WebP, or SVG", "التنسيق: PNG مع شفافية، WebP، أو SVG")}</li>
              <li>{t("Maximum size: 5MB", "الحد الأقصى للحجم: 5 ميغابايت")}</li>
              <li>{t("Recommended size for hero logo: 400×200px or larger", "الحجم الموصى به لشعار الهيرو: 400×200 بكسل أو أكبر")}</li>
              <li>{t("Recommended size for header logo: 120×60px", "الحجم الموصى به لشعار الرأس: 120×60 بكسل")}</li>
              <li>{t("Light-colored logo works best on the hero background", "الشعار ذو الألوان الفاتحة يعمل بشكل أفضل على خلفية الهيرو")}</li>
            </ul>
          </div>
        </div>

        {/* ── Save ─────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2">
            {saving && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? t("Saving...", "جاري الحفظ...") : t("Save Settings", "حفظ الإعدادات")}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-primary/5 active:scale-[0.98] transition-all">
            {t("Cancel", "إلغاء")}
          </button>
        </div>
      </form>

      {/* ── Direct Ordering System Feature Toggle ── */}
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t("Direct Table Ordering System", "نظام الطلبات المباشر")}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {t("Allow customers to place orders directly from their tables", "السماح للعملاء بتقديم الطلبات مباشرة من الطاولات")}
            </p>
          </div>
        </div>

        {tierStatus === "basic" ? (
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#f5efdf" }}>
            <div className="flex items-center gap-3">
              <span className="text-lg">🔒</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#8a7a6a" }}>
                  {t("Basic Plan", "الباقة الأساسية")}
                </p>
                <p className="text-xs" style={{ color: "#b5a594" }}>
                  {t("This feature is available in the Pro plan. Upgrade now to receive orders directly from tables.", "هذه الميزة متاحة في الباقة الاحترافية، قم بالترقية الآن لاستقبال الطلبات مباشرة من الطاولات")}
                </p>
              </div>
            </div>
            <button type="button" onClick={async () => {
              await updateSettings({ hero_image_url: heroImageUrl, hero_logo_url: heroLogoUrl, header_logo_url: headerLogoUrl, tier: "pro", ordering_enabled: true, enable_usd: enableUsd });
              setTierState("pro"); setOrderingState(true); setSuccess(true); setTimeout(() => setSuccess(false), 3000);
            }}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] border-0"
              style={{ backgroundColor: "#9a6a3a", color: "#fff" }}>
              {t("Upgrade", "ترقية")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#f5efdf" }}>
            <div className="flex items-center gap-3">
              <span className="text-lg">🛒</span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("Pro Plan", "الباقة الاحترافية")}
                </p>
                <p className="text-xs text-muted">
                  {orderingEnabled
                    ? t("Customers can now place orders directly from their tables", "يمكن للعملاء الآن تقديم الطلبات مباشرة من الطاولات")
                    : t("Ordering is currently disabled. Toggle to enable.", "الطلب معطل حالياً. قم بالتبديل للتفعيل.")}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={orderingEnabled}
              onClick={async () => {
                const next = !orderingEnabled;
                setOrderingState(next);
                await updateSettings({ hero_image_url: heroImageUrl, hero_logo_url: heroLogoUrl, header_logo_url: headerLogoUrl, tier: "pro", ordering_enabled: next, enable_usd: enableUsd });
              }}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 border-0 shrink-0 ${
                orderingEnabled ? "bg-primary" : "bg-muted/30"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  orderingEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

      </div>

      {/* ── Currency Display Toggle ── */}
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] mt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t("USD Currency Display", "تفعيل عرض الدولار")}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {enableUsd
                ? t("USD prices are visible to customers", "أسعار الدولار مرئية للعملاء")
                : t("Only SYP prices are visible to customers", "فقط أسعار الليرة السورية مرئية للعملاء")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enableUsd}
            onClick={async () => {
              const next = !enableUsd;
              setEnableUsd(next);
              await updateSettings({ hero_image_url: heroImageUrl, hero_logo_url: heroLogoUrl, header_logo_url: headerLogoUrl, tier: tierStatus, ordering_enabled: orderingEnabled, enable_usd: next });
              setSuccess(true);
              setTimeout(() => setSuccess(false), 3000);
            }}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 border-0 shrink-0 ${
              enableUsd ? "bg-primary" : "bg-muted/30"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                enableUsd ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Generate PDF Menu ──────────────────── */}
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] mt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t("Printable PDF Menu", "قائمة طعام قابلة للطباعة (PDF)")}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {t("Generate a professional A4 printable menu for customers who prefer physical menus", "إنشاء قائمة طعام احترافية بصيغة A4 للطباعة للعملاء الذين يفضلون القوائم الورقية")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.open(`/${locale}/admin/print`, "_blank")}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t("Generate PDF Menu", "استخراج المنيو كملف (PDF)")}
          </button>
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────── */}
      <div className="mt-10 space-y-4">
        <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">
          {t("Danger Zone", "منطقة الخطر")}
        </h3>

        {/* Logout */}
        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("Sign Out", "تسجيل الخروج")}</p>
            <p className="text-xs text-muted mt-0.5">{t("End your current admin session", "إنهاء جلسة المسؤول الحالية")}</p>
          </div>
          <button type="button" onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all border border-red-200">
            {t("Logout", "تسجيل الخروج")}
          </button>
        </div>

        {/* Reset Analytics */}
        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("Reset Analytics", "إعادة تعيين الإحصائيات")}</p>
            <p className="text-xs text-muted mt-0.5">
              {t("Delete all analytics events and reset view counts to zero", "حذف جميع أحداث الإحصائيات وإعادة أعداد المشاهدات إلى الصفر")}
            </p>
          </div>
          <button type="button" onClick={() => setShowResetDialog(true)}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all border border-red-200 shrink-0">
            {t("Reset", "إعادة تعيين")}
          </button>
        </div>
      </div>

      {/* ── Reset Confirmation Dialog ──────────── */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowResetDialog(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ animation: "scaleIn 0.2s ease-out" }}>
            <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <h4 className="text-base font-bold text-red-600 mb-1">
              {t("Confirm Reset", "تأكيد إعادة التعيين")}
            </h4>
            <p className="text-sm text-muted mb-5">
              {t("Enter your admin credentials to confirm. This action cannot be undone.", "أدخل بيانات المسؤول الخاصة بك للتأكيد. لا يمكن التراجع عن هذا الإجراء.")}
            </p>

            {resetError && (
              <div className="mb-3 p-2.5 rounded-xl bg-error-bg border border-error-border text-xs text-error">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetAnalytics} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("Email", "البريد الإلكتروني")}</label>
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                  required placeholder="admin@shababik.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("Password", "كلمة المرور")}</label>
                <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="submit" disabled={resetting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {resetting && (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {resetting ? t("Resetting...", "جاري إعادة التعيين...") : t("Reset Everything", "إعادة تعيين الكل")}
                </button>
                <button type="button" onClick={() => { setShowResetDialog(false); setResetError(""); }}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-primary/5 transition-all">
                  {t("Cancel", "إلغاء")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
