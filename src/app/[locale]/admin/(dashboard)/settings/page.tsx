"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSettings, updateSettings } from "@/lib/actions/settings";
import { resetAnalytics } from "@/lib/actions/reset-analytics";
import { createStaffAccount, listStaffAccounts, deleteStaffAccount, type StaffAccount } from "@/lib/actions/staff";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import type { SiteSettingsRow } from "@/lib/validations";

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const staffMsg = (errorCode: string | undefined, enFallback: string, arFallback: string) => {
    if (errorCode === "AUTH_REQUIRED") {
      return locale === "ar"
        ? "غير مصرح لك بإدارة حسابات الموظفين. يرجى التأكد من تسجيل الدخول كمشرف رئيسي."
        : "You are not authorized to manage staff accounts. Please make sure you are logged in as a super admin.";
    }
    return errorCode || (locale === "ar" ? arFallback : enFallback);
  };

  const [settings, setSettings] = useState<SiteSettingsRow | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroLogoUrl, setHeroLogoUrl] = useState("");
  const [headerLogoUrl, setHeaderLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showResetWarning, setShowResetWarning] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const [tierStatus, setTierState] = useState<"basic" | "pro">("basic");
  const [orderingEnabled, setOrderingState] = useState(false);
  const [enableUsd, setEnableUsd] = useState(true);
  const [activeCurrency, setActiveCurrency] = useState<"TRY" | "SYP">("TRY");

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffCreating, setStaffCreating] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [staffUsers, setStaffUsers] = useState<StaffAccount[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffFetchError, setStaffFetchError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        setActiveCurrency((s as any).active_currency ?? "TRY");
      }
    });
  }, []);

  useEffect(() => {
    loadStaffAccounts();
  }, []);

  const loadStaffAccounts = async () => {
    setStaffFetchError("");
    setStaffLoading(true);
    try {
      const res = await listStaffAccounts();
      if (res.success && res.users) {
        setStaffUsers(res.users);
      } else {
        setStaffFetchError(staffMsg(
          res.error,
          "Failed to load staff accounts. Please try again later.",
          "فشل تحميل حسابات الموظفين. يرجى المحاولة لاحقاً."
        ));
      }
    } catch (err: any) {
      setStaffFetchError(staffMsg(
        undefined,
        "Failed to load staff accounts. Please try again later.",
        "فشل تحميل حسابات الموظفين. يرجى المحاولة لاحقاً."
      ));
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    setStaffSuccess("");
    setStaffCreating(true);
    try {
      const res = await createStaffAccount(staffEmail, staffPassword);
      if (res.success) {
        setStaffSuccess(
          locale === "ar" ? "تم إنشاء حساب الموظف بنجاح" : "Staff account created successfully"
        );
        setStaffEmail("");
        setStaffPassword("");
        await loadStaffAccounts();
      } else {
        setStaffError(staffMsg(
          res.error,
          "Failed to create account",
          "فشل إنشاء الحساب"
        ));
      }
    } catch (err: any) {
      setStaffError(staffMsg(
        undefined,
        "Failed to create account",
        "فشل إنشاء الحساب"
      ));
    }
    setStaffCreating(false);
  };

  const handleDeleteStaff = async (userId: string, userEmail: string) => {
    if (!window.confirm(
      locale === "ar"
        ? `هل أنت متأكد من حذف ${userEmail}؟`
        : `Are you sure you want to delete ${userEmail}?`
    )) return;

    setDeletingId(userId);
    try {
      const res = await deleteStaffAccount(userId);
      if (res.success) {
        await loadStaffAccounts();
      } else {
        setStaffError(staffMsg(
          res.error,
          "Failed to delete account",
          "فشل حذف الحساب"
        ));
      }
    } catch (err: any) {
      setStaffError(staffMsg(
        undefined,
        "Failed to delete account",
        "فشل حذف الحساب"
      ));
    }
    setDeletingId(null);
  };

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
        active_currency: activeCurrency,
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
      const res = await resetAnalytics();
      if (res.success) {
        setShowResetWarning(false);
        setResetPassword("");
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
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
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-8">
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
      {resetSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {t("System reset successfully", "تم تصفير النظام بنجاح")}
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
                      active_currency: activeCurrency,
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
                        active_currency: activeCurrency,
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
                  active_currency: activeCurrency,
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

      {/* ── Section: Currency Settings ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("Currency Settings", "إعدادات العملة")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("Select which currency customers see across the menu, cart, and checkout", "اختر العملة التي يراها العملاء في القائمة والسلة والدفع")}
          </p>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["TRY", "SYP"] as const).map((currency) => {
              const labels: Record<string, string> = {
                TRY: t("Turkish Lira (TL)", "الليرة التركية (TL)"),
                SYP: t("Syrian Pound (SYP)", "الليرة السورية (ل.س)"),
              };
              const descriptions: Record<string, string> = {
                TRY: t("Prices shown in TL", "الأسعار بالليرة التركية"),
                SYP: t("Prices shown in SYP", "الأسعار بالليرة السورية"),
              };
              const isActive = activeCurrency === currency;
              return (
                <button
                  key={currency}
                  type="button"
                  onClick={async () => {
                    setActiveCurrency(currency);
                    await updateSettings({
                      hero_image_url: heroImageUrl,
                      hero_logo_url: heroLogoUrl,
                      header_logo_url: headerLogoUrl,
                      tier: tierStatus,
                      ordering_enabled: orderingEnabled,
                      enable_usd: enableUsd,
                      active_currency: currency,
                    });
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isActive ? "border-gray-900" : "border-gray-300"
                      }`}
                    >
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-gray-900" />
                      )}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {currency}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">{labels[currency]}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {descriptions[currency]}
                  </p>
                </button>
              );
            })}
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

      {/* ── Section 3.5: Staff Management ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("Staff Management", "إدارة الموظفين")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("Create and manage staff accounts for order taking", "إنشاء وإدارة حسابات الموظفين لاستقبال الطلبات")}
          </p>
        </div>

        {/* Create Staff Form */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t("Create New Staff Account", "إنشاء حساب موظف جديد")}
          </p>
          {staffError && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {staffError}
            </div>
          )}
          {staffSuccess && (
            <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              {staffSuccess}
            </div>
          )}
          <form onSubmit={handleCreateStaff} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t("Email", "البريد الإلكتروني")}
                </label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  required
                  placeholder="staff@shababik.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t("Password", "كلمة المرور")}
                </label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={staffCreating}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {staffCreating && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {t("Create Account", "إنشاء حساب")}
            </button>
          </form>
        </div>

        {/* Staff List */}
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t("Existing Staff Accounts", "حسابات الموظفين الحالية")}
          </p>
          {staffLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted py-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("Loading...", "جاري التحميل...")}
            </div>
          ) : staffFetchError ? (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {staffFetchError}
            </div>
          ) : staffUsers.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              {t("No staff accounts yet", "لا توجد حسابات موظفين بعد")}
            </p>
          ) : (
            <div className="space-y-2">
              {staffUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      {t("Created", "تم الإنشاء")}{" "}
                      {new Date(user.created_at).toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {user.last_sign_in_at && (
                        <> &middot; {t("Last login:", "آخر دخول:")}{" "}
                          {new Date(user.last_sign_in_at).toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteStaff(user.id, user.email)}
                    disabled={deletingId === user.id}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {deletingId === user.id
                      ? t("Deleting...", "جاري الحذف...")
                      : t("Delete", "حذف")}
                  </button>
                </div>
              ))}
            </div>
          )}
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
                  "Permanently delete all orders, feedback, analytics events, and reset view counts to zero",
                  "حذف نهائي لجميع الطلبات والتقييمات وإحصائيات المشاهدات وإعادتها إلى الصفر"
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetWarning(true)}
              className="shrink-0 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all"
            >
              {t("Reset Data", "تصفير البيانات")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Save & Cancel ── */}
      <div className="w-full mt-8 mb-12 flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
        >
          {t("Cancel", "إلغاء")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#3C3025] text-white px-8 py-3 rounded-xl font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50 inline-flex items-center gap-2"
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

      {/* ── Reset Warning Dialog ── */}
      {showResetWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { setShowResetWarning(false); setResetError(""); }}
          onKeyDown={(e) => { if (e.key === "Escape") { setShowResetWarning(false); setResetError(""); }}}
          role="dialog"
          aria-modal="true"
          aria-label={t("Confirm Reset Analytics", "تأكيد إعادة تعيين الإحصائيات")}
          tabIndex={-1}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ animation: "scaleIn 0.2s ease-out" }}
          >
            <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚠️</span>
              <h4 className="text-base font-bold text-red-600">
                {t("WARNING: Destructive Action", "تحذير خطير: إجراء مدمر")}
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {locale === "ar"
                ? "أنت على وشك حذف جميع الطلبات، الفواتير، التقييمات، وإحصائيات المنتجات بالكامل. لا يمكن التراجع عن هذا الإجراء."
                : "You are about to delete all orders, invoices, feedback, and product statistics entirely. This action cannot be undone."}
            </p>

            {resetError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetAnalytics} className="space-y-3">
              <div>
                <label htmlFor="reset-password-confirm" className="block text-xs font-medium text-gray-700 mb-1">
                  {t("Admin Password", "كلمة مرور المسؤول")}
                </label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {locale === "ar"
                    ? "مطلوب كلمة مرور المسؤول لتأكيد هذا الإجراء المدمر"
                    : "Admin password required to confirm this destructive action"}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={resetting || !resetPassword}
                  className="flex-1 min-h-[44px] py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetting && (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {resetting
                    ? t("Resetting...", "جاري الحذف...")
                    : t("Confirm Final Deletion", "تأكيد الحذف النهائي")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetWarning(false);
                    setResetPassword("");
                    setResetError("");
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
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
