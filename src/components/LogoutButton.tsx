"use client";

import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function LogoutButton() {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="btn btn-outline btn-sm"
    >
      {t("signOut")}
    </button>
  );
}
