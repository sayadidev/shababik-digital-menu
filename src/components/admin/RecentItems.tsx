import { Link } from "@/i18n/navigation";

type RecentItem = {
  id: string;
  name_en: string;
  name_ar: string;
  is_active: boolean;
};

export default function RecentItems({ items, locale }: { items: RecentItem[]; locale: string }) {
  const emptyMarkup = (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{locale === "ar" ? "أحدث الأصناف" : "Recent Items"}</h3>
        <Link href="/admin/items" locale={locale} className="text-xs text-primary font-medium hover:underline">
          {locale === "ar" ? "عرض الكل ←" : "View All →"}
        </Link>
      </div>
      <p className="text-sm text-muted text-center py-6">{locale === "ar" ? "لا توجد أصناف بعد" : "No items yet"}</p>
    </div>
  );

  if (items.length === 0) return emptyMarkup;

  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{locale === "ar" ? "أحدث الأصناف" : "Recent Items"}</h3>
        <Link href="/admin/items" locale={locale} className="text-xs text-primary font-medium hover:underline">
          {locale === "ar" ? "عرض الكل ←" : "View All →"}
        </Link>
      </div>
      <div className="flex md:grid md:grid-cols-5 gap-3 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide">
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="bg-surface rounded-xl p-3 min-w-[140px] md:min-w-0 shrink-0 md:shrink flex flex-col items-center text-center gap-2 border border-border/50 shadow-none"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto flex items-center justify-center text-lg">
              🍽
            </div>
            <p className="text-xs font-medium text-foreground leading-tight">{item.name_en}</p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                item.is_active
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {item.is_active
                ? (locale === "ar" ? "نشط" : "Active")
                : (locale === "ar" ? "غير نشط" : "Inactive")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
