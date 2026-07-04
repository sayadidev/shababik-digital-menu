import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMenuData } from "@/lib/menu";
import PrintableMenu from "./PrintableMenu";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PrintPage({ params }: Props) {
  const { locale } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect({ href: "/admin/login", locale });
  }

  const data = await getMenuData();

  return <PrintableMenu data={data} locale={locale} />;
}
