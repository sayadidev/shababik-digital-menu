import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth";
import { getSettings } from "@/lib/actions/settings";
import NavRail from "@/components/admin/NavRail";
import BottomNav from "@/components/admin/BottomNav";
import TopBar from "@/components/admin/TopBar";
import StaffGuard from "@/components/admin/StaffGuard";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const FALLBACK_LOGO = "/wooden-trans-logo.webp";

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;

  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Admin auth check error:", error.message);
  }

  if (!session) {
    redirect({ href: "/admin/login", locale });
  }

  const role = getUserRole(session);

  const settings = await getSettings().catch(() => null);
  const headerLogoUrl = settings?.header_logo_url || FALLBACK_LOGO;
  const tier = (settings?.tier as "basic" | "pro") ?? "basic";
  const orderingEnabled = settings?.ordering_enabled ?? false;
  const isPro = tier === "pro" && orderingEnabled;

  return (
    <div className="flex h-screen overflow-hidden">
      <NavRail headerLogoUrl={headerLogoUrl} role={role} isPro={isPro} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-[80px] md:pb-0 bg-background md:pl-60 rtl:md:pr-60 rtl:md:pl-0">
        <TopBar headerLogoUrl={headerLogoUrl} />
        <main className="flex-1">
          <StaffGuard role={role} locale={locale}>
            {children}
          </StaffGuard>
        </main>
      </div>
      <BottomNav role={role} isPro={isPro} />
    </div>
  );
}
