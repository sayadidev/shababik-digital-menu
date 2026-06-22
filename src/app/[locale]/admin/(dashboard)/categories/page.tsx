import { getCategories } from "@/lib/actions/category";
import { getItems } from "@/lib/actions/item";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/category";
import { CreateButton, EditButton, DeleteButton } from "./categories-client";

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t("Categories", "الأقسام")}</h2>
                        <CreateButton />
      </div>

      {categoriesWithCounts.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
          <p className="text-muted text-sm">{t("No categories yet. Create your first one.", "لا توجد أقسام بعد. أنشئ القسم الأول.")}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("English Name", "الاسم بالإنجليزية")}</th>
                  <th className="text-start px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Arabic Name", "الاسم بالعربية")}</th>
                  <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Items", "الأصناف")}</th>
                  <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Order", "الترتيب")}</th>
                  <th className="text-end px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Actions", "إجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {categoriesWithCounts.map((cat) => (
                  <tr key={cat.id} className="border-b border-border/50 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{cat.name_en}</td>
                    <td className="px-5 py-3.5 text-foreground" dir="rtl">{cat.name_ar}</td>
                    <td className="px-5 py-3.5 text-center text-muted">{cat.itemCount}</td>
                    <td className="px-5 py-3.5 text-center text-muted">{cat.order_index}</td>
                    <td className="px-5 py-3.5 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <EditButton category={cat} />
                        <DeleteButton category={cat} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border/50">
            {categoriesWithCounts.map((cat) => (
              <div key={cat.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{cat.name_en}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                    #{cat.order_index}
                  </span>
                </div>
                <p className="text-xs text-muted" dir="rtl">{cat.name_ar} · {cat.itemCount} {t("items", "أصناف")}</p>
                <div className="flex gap-2 pt-1">
                  <EditButton category={cat} />
                  <DeleteButton category={cat} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
