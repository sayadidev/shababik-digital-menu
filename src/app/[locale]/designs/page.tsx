import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function DesignsIndex({ params }: Props) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-[#f5f0ec]">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[#1c1410] mb-3">
          Shababik Digital Menu
        </h1>
        <p className="text-[#6a5a4a] max-w-xl mx-auto mb-10">
          Browse our full menu — hot drinks, iced coffee, desserts, and appetizers.
        </p>
        <Link
          href={`/${locale === "ar" ? "ar" : "en"}/`}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#b8743a] px-8 py-4 text-lg font-bold text-white transition-all hover:bg-[#9a5c2a] hover:-translate-y-0.5 hover:shadow-lg"
        >
          View Menu
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
