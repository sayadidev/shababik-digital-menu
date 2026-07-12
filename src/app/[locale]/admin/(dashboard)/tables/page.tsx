import { getTables } from "@/lib/actions/tables";
import { isProActive } from "@/lib/actions/settings-public";
import TablesClient from "./tables-client";
import ProLockedScreen from "@/components/admin/ProLockedScreen";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const proActive = await isProActive().catch(() => false);

  if (!proActive) {
    return (
      <ProLockedScreen
        locale={locale}
        featureNameEn="Table Management"
        featureNameAr="إدارة الطاولات"
        descriptionEn="The table management system is available exclusively in the Pro plan."
        descriptionAr="نظام إدارة الطاولات متاح حصرياً في الباقة الاحترافية."
      />
    );
  }

  const tables = await getTables().catch(() => []);
  return <TablesClient tables={tables} locale={locale} />;
}
