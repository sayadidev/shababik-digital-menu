"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const otherLocale = locale === "en" ? "ar" : "en";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-2xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] p-8">
          <div className="flex flex-col items-center mb-8">
            <img src="/wooden-trans-logo.webp" alt="Shababik" className="w-16 h-16 object-contain mb-4" />
            <h1 className="text-lg font-bold text-foreground">{t("Admin Login", "تسجيل الدخول")}</h1>
            <p className="text-sm text-muted mt-1">{t("Sign in to manage your menu", "سجل الدخول لإدارة القائمة")}</p>
          </div>

          <Link
            href="/admin/login"
            locale={otherLocale}
            className="text-xs text-primary font-medium hover:underline text-center block mb-4"
          >
            {t("Switch to العربية", "Switch to English")}
          </Link>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error-bg border border-error-border text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("Email", "البريد الإلكتروني")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shababik.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("Password", "كلمة المرور")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? t("Signing in...", "جاري تسجيل الدخول...") : t("Sign In", "تسجيل الدخول")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
