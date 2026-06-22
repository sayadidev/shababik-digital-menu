import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import NavRail from "@/components/admin/NavRail";
import BottomNav from "@/components/admin/BottomNav";
import TopBar from "@/components/admin/TopBar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

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

  return (
    <>
      <NavRail />
      <div className="md:pl-[72px] rtl:md:pr-[72px] rtl:md:pl-0 pb-[80px] md:pb-0 min-h-screen bg-background">
        <TopBar />
        <main>{children}</main>
      </div>
      <BottomNav />
    </>
  );
}
