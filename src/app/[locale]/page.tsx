import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMenuData } from "@/lib/menu";
import Design10 from "@/components/designs/Design10";
import SkeletonMenu from "@/components/menu/SkeletonMenu";
import { CartProvider } from "@/context/CartContext";
import { ActiveOrderProvider } from "@/context/ActiveOrderContext";
import { ToastProvider } from "@/components/menu/Toast";
import { validateToken } from "@/lib/actions/tables";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  return {
    title: `Design 10 — ${t("meta_title")}`,
    description: t("meta_description"),
    openGraph: {
      title: t("meta_title"),
      description: t("meta_description"),
      type: "website",
      locale: locale === "ar" ? "ar_SY" : "en_US",
      siteName: "Shababik Cafe",
    },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const [data, sp] = await Promise.all([getMenuData(), searchParams]);

  let tableResult: { valid: boolean; table_number: string | null } | null = null;
  if (sp.t) {
    tableResult = await validateToken(sp.t);
  }

  return (
    <Suspense fallback={<SkeletonMenu />}>
      <CartProvider>
        <ActiveOrderProvider>
          <ToastProvider>
            <Design10 data={data} secureToken={sp.t ?? null} tableResult={tableResult} />
          </ToastProvider>
        </ActiveOrderProvider>
      </CartProvider>
    </Suspense>
  );
}
