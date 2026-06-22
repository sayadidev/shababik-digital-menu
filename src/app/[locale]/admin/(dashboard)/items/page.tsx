import { Link } from "@/i18n/navigation";
import { getItems } from "@/lib/actions/item";
import { toggleActive, deleteItem } from "@/lib/actions/item";
import { ToggleButton, OfferPositionSelect, DeleteButton } from "./items-client";

export default async function ItemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const items = await getItems().catch(() => []);

  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t("Menu Items", "الأصناف")} ({items.length})</h2>
        <Link
          href="/admin/items/new"
          locale={locale}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          + {t("New Item", "صنف جديد")}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
          <p className="text-muted text-sm">{t("No items yet. Create your first one.", "لا توجد أصناف بعد. أنشئ الصنف الأول.")}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Name", "الاسم")}</th>
                  <th className="text-start px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Category", "القسم")}</th>
                  <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Views", "المشاهدات")}</th>
                  <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Active", "نشط")}</th>
                  <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Hero", "الهيرو")}</th>
                  <th className="text-end px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Actions", "إجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">{item.name_en}</p>
                        <p className="text-xs text-muted">{item.name_ar}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{item.category_name_en}</td>
                    <td className="px-5 py-3.5 text-center text-muted">{item.view_count}</td>
                    <td className="px-5 py-3.5 text-center">
                      <ToggleButton item={item} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <OfferPositionSelect item={item} />
                    </td>
                    <td className="px-5 py-3.5 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/items/${item.id}/edit`}
                          locale={locale}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all"
                          title={t("Edit", "تعديل")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <DeleteButton item={item} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border/50">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{item.name_en}</span>
                      <p className="text-xs text-muted">{item.name_ar}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OfferPositionSelect item={item} />
                      <ToggleButton item={item} />
                    </div>
                  </div>
                <p className="text-xs text-muted">{item.category_name_en} · {item.view_count} {t("views", "مشاهدة")}</p>
                <div className="flex gap-2 pt-1">
                  <Link href={`/admin/items/${item.id}/edit`} locale={locale} className="text-xs text-primary font-medium">{t("Edit", "تعديل")}</Link>
                  <DeleteButton item={item} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
