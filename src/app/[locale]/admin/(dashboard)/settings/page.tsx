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

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

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

  const handleSave = async () => {
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
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      } else {
        setError(res.error ?? t("Failed to save settings", "فشل حفظ الإعدادات"));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("An unexpected error occurred", "حدث خطأ غير متوقع")
      );
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
      setResetError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-[140px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" className="rtl:hidden" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19l7-7-7-7" className="ltr:hidden" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {t("Settings", "الإعدادات")}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("Manage your cafe appearance and preferences", "إدارة مظهر الكافية والإعدادات")}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {t("Settings saved successfully!", "تم حفظ الإعدادات بنجاح!")}
        </div>
      )}

      {/* ── Section 1: Appearance ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("Appearance & Branding", "المظهر والهوية")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("Hero images and logo assets displayed on your menu page", "صور الخلفية والشعارات المعروضة في صفحة القائمة")}
          </p>
        </div>

        {/* Hero Background */}
        <div className="px-5 py-4 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("Hero Background Image", "صورة خلفية الهيرو")}
          </label>
          <ImageUpload
            currentUrl={heroImageUrl}
            onUpload={setHeroImageUrl}
            locale={locale}
            formatHint={t("JPEG, PNG, WebP", "JPEG، PNG، WebP")}
            sizeHint={t("Max 10MB", "الحد الأقصى 10 ميغابايت")}
            dimsHint={t("1440×900px recommended", "الأبعاد الموصى بها: 1440×900 بكسل")}
          />
        </div>

        {/* Hero Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("Hero Logo", "شعار الهيرو")}
          </label>
          <ImageUpload
            currentUrl={heroLogoUrl}
            onUpload={setHeroLogoUrl}
            locale={locale}
            formatHint={t("PNG with transparency, WebP, SVG", "PNG شفاف، WebP، SVG")}
            sizeHint={t("Max 5MB", "الحد الأقصى 5 ميغابايت")}
            dimsHint={t("400×200px recommended", "الأبعاد الموصى بها: 400×200 بكسل")}
          />
        </div>

        {/* Header Logo */}
        <div className="px-5 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("Header & Footer Logo", "شعار الرأس والتذييل")}
          </label>
          <ImageUpload
            currentUrl={headerLogoUrl}
            onUpload={setHeaderLogoUrl}
            locale={locale}
            formatHint={t("PNG with transparency, WebP, SVG", "PNG شفاف، WebP، SVG")}
            sizeHint={t("Max 5MB", "الحد الأقصى 5 ميغابايت")}
            dimsHint={t("120×60px recommended", "الأبعاد الموصى بها: 120×60 بكسل")}
          />
        </div>
      </div>

      {/* ── Section 2: Store Setup ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("Store Setup", "إعدادات المتجر")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("Feature toggles and currency preferences", "تفعيل الميزات وإعدادات العملة")}
          </p>
        </div>

        {/* Pro Package Row */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("Direct Table Ordering", "نظام الطلبات المباشر")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("Allow customers to place orders from their table", "السماح للعملاء بتقديم الطلبات من الطاولة")}
              </p>
            </div>
            <div className="shrink-0">
              {tierStatus === "basic" ? (
                <button
                  type="button"
                  onClick={async () => {
                    await updateSettings({
                      hero_image_url: heroImageUrl,
                      hero_logo_url: heroLogoUrl,
                      header_logo_url: headerLogoUrl,
                      tier: "pro",
                      ordering_enabled: true,
                      enable_usd: enableUsd,
                    });
                    setTierState("pro");
                    setOrderingState(true);
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all active:scale-[0.98]"
                >
                  {t("Upgrade to Pro", "الترقية للباقة الاحترافية")}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    Pro
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={orderingEnabled}
                    onClick={async () => {
                      const next = !orderingEnabled;
                      setOrderingState(next);
                      await updateSettings({
                        hero_image_url: heroImageUrl,
                        hero_logo_url: heroLogoUrl,
                        header_logo_url: headerLogoUrl,
                        tier: "pro",
                        ordering_enabled: next,
                        enable_usd: enableUsd,
                      });
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 border-0 shrink-0 ${
                      orderingEnabled ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        orderingEnabled
                          ? "translate-x-5 left-0.5"
                          : "translate-x-0 left-0.5"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* USD Toggle Row */}
        <div className="px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("USD Currency Display", "عرض الأسعار بالدولار")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {enableUsd
                  ? t("Both USD and SYP prices are visible to customers", "أسعار الدولار والليرة السورية مرئية للعملاء")
                  : t("Only SYP prices shown to customers", "فقط أسعار الليرة السورية معروضة للعملاء")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enableUsd}
              onClick={async () => {
                const next = !enableUsd;
                setEnableUsd(next);
                await updateSettings({
                  hero_image_url: heroImageUrl,
                  hero_logo_url: heroLogoUrl,
                  header_logo_url: headerLogoUrl,
                  tier: tierStatus,
                  ordering_enabled: orderingEnabled,
                  enable_usd: next,
                });
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
              }}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 border-0 shrink-0 ${
                enableUsd ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  enableUsd
                    ? "translate-x-5 left-0.5"
                    : "translate-x-0 left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 3: Admin Tools ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("Admin Tools", "أدوات الإدارة")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("Export and utility actions for your menu", "أدوات التصدير والإدارة المساعدة")}
          </p>
        </div>

        {/* PDF Export Row */}
        <div className="px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("Printable PDF Menu", "قائمة طعام قابلة للطباعة (PDF)")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {t(
                  "Generate a professional A4 printable menu for customers who prefer physical menus",
                  "إنشاء قائمة طعام احترافية بصيغة A4 للطباعة للعملاء الذين يفضلون القوائم الورقية"
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.open(`/${locale}/admin/print`, "_blank")}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t("Generate PDF Menu", "استخراج المنيو كملف (PDF)")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 4: Danger Zone ── */}
      <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-red-100 bg-red-50/50">
          <h3 className="text-sm font-semibold text-red-700">
            {t("Danger Zone", "منطقة الخطر")}
          </h3>
          <p className="text-xs text-red-500 mt-0.5">
            {t("Destructive actions — proceed with caution", "إجراءات خطيرة — تابع بحذر")}
          </p>
        </div>

        {/* Sign Out Row */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("Sign Out", "تسجيل الخروج")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("End your current admin session", "إنهاء جلسة المسؤول الحالية")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 px-4 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 active:scale-[0.98] transition-all"
            >
              {t("Logout", "تسجيل الخروج")}
            </button>
          </div>
        </div>

        {/* Reset Analytics Row */}
        <div className="px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("Reset Analytics", "إعادة تعيين الإحصائيات")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {t(
                  "Permanently delete all analytics events and reset view counts to zero",
                  "حذف جميع أحداث الإحصائيات وإعادة أعداد المشاهدات إلى الصفر"
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="shrink-0 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all"
            >
              {t("Reset", "إعادة تعيين")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky Save Footer ── */}
      <div
        className="fixed left-0 right-0 w-full bg-white border-t border-gray-200 p-4 flex justify-between sm:justify-end items-center gap-3 z-[60] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        style={{ bottom: "72px" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
        >
          {t("Cancel", "إلغاء")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saving ? t("Saving...", "جاري الحفظ...") : t("Save Settings", "حفظ الإعدادات")}
        </button>
      </div>

      {/* ── Reset Confirmation Dialog ── */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowResetDialog(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ animation: "scaleIn 0.2s ease-out" }}
          >
            <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <h4 className="text-base font-bold text-red-600 mb-1">
              {t("Confirm Reset", "تأكيد إعادة التعيين")}
            </h4>
            <p className="text-sm text-gray-500 mb-5">
              {t(
                "Enter your admin credentials to confirm. This action cannot be undone.",
                "أدخل بيانات المسؤول الخاصة بك للتأكيد. لا يمكن التراجع عن هذا الإجراء."
              )}
            </p>

            {resetError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetAnalytics} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("Email", "البريد الإلكتروني")}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="admin@shababik.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("Password", "كلمة المرور")}
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetting && (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {resetting
                    ? t("Resetting...", "جاري إعادة التعيين...")
                    : t("Reset Everything", "إعادة تعيين الكل")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetDialog(false);
                    setResetError("");
                  }}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                >
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
