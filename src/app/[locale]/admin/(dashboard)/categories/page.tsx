import { getCategories } from "@/lib/actions/category";
import { getItems } from "@/lib/actions/item";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/category";
import { CreateButton, EditButton, DeleteButton, CategoryList } from "./categories-client";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [categories, items] = await Promise.all([
    getCategories().catch(() => []),
    getItems().catch(() => []),
  ]);

  const itemsByCategory = new Map<string, number>();
  for (const item of items) {
    itemsByCategory.set(item.category_id, (itemsByCategory.get(item.category_id) ?? 0) + 1);
  }

  const categoriesWithCounts = categories.map((cat) => ({
    ...cat,
    itemCount: itemsByCategory.get(cat.id) ?? 0,
  }));

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <div className="flex items-center justify-end">
                        <CreateButton />
      </div>

      {categoriesWithCounts.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
          <p className="text-muted text-sm">{t("No categories yet. Create your first one.", "لا توجد أقسام بعد. أنشئ القسم الأول.")}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] p-2">
          <CategoryList categories={categoriesWithCounts} locale={locale} />
        </div>
      )}


    </div>
  );
}
