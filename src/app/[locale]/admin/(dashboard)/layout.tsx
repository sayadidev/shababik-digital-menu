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

  return (
    <>
      <NavRail headerLogoUrl={headerLogoUrl} role={role} />
      <div className="md:pl-[72px] rtl:md:pr-[72px] rtl:md:pl-0 pb-[80px] md:pb-0 h-screen overflow-y-auto bg-background">
        <TopBar headerLogoUrl={headerLogoUrl} />
        <main>
          <StaffGuard role={role} locale={locale}>
            {children}
          </StaffGuard>
        </main>
      </div>
      <BottomNav role={role} />
    </>
  );
}
