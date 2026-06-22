import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMenuData } from "@/lib/menu";
import Design10 from "@/components/designs/Design10";
import SkeletonMenu from "@/components/menu/SkeletonMenu";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
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

export default async function HomePage() {
  const data = await getMenuData();

  return (
    <Suspense fallback={<SkeletonMenu />}>
      <Design10 data={data} />
    </Suspense>
  );
}
