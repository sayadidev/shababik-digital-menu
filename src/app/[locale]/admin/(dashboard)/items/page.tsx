import { Link } from "@/i18n/navigation";
import { getItems } from "@/lib/actions/item";
import { getCategories } from "@/lib/actions/category";
import ItemsList from "./items-list";

export default async function ItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [items, categories] = await Promise.all([
    getItems().catch(() => []),
    getCategories().catch(() => []),
  ]);

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <div className="flex items-center justify-end">
        <Link
          href="/admin/items/new"
          locale={locale}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          + {t("New Item", "صنف جديد")}
        </Link>
      </div>

      <ItemsList items={items} categories={categories} />
    </div>
  );
}
