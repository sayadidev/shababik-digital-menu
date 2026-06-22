import { Link } from "@/i18n/navigation";

export default function QuickActions({ locale }: { locale: string }) {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
      <h3 className="text-sm font-semibold text-foreground mb-4">{locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/items/new"
          locale={locale}
          className="p-4 rounded-xl border border-border text-start hover:border-primary hover:bg-primary/5 transition-all"
        >
          <p className="text-lg mb-1">🍽</p>
          <p className="text-sm font-medium text-foreground">{locale === "ar" ? "صنف جديد" : "New Item"}</p>
          <p className="text-xs text-muted">{locale === "ar" ? "أضف إلى القائمة" : "Add to menu"}</p>
        </Link>
        <Link
          href="/admin/categories"
          locale={locale}
          className="p-4 rounded-xl border border-border text-start hover:border-primary hover:bg-primary/5 transition-all"
        >
          <p className="text-lg mb-1">📂</p>
          <p className="text-sm font-medium text-foreground">{locale === "ar" ? "قسم" : "Category"}</p>
          <p className="text-xs text-muted">{locale === "ar" ? "تنظيم القائمة" : "Organize menu"}</p>
        </Link>
        <Link
          href="/admin/analytics"
          locale={locale}
          className="p-4 rounded-xl border border-border text-start hover:border-primary hover:bg-primary/5 transition-all"
        >
          <p className="text-lg mb-1">📊</p>
          <p className="text-sm font-medium text-foreground">{locale === "ar" ? "تقرير" : "Report"}</p>
          <p className="text-xs text-muted">{locale === "ar" ? "عرض الإحصائيات" : "View analytics"}</p>
        </Link>
        <Link
          href="/"
          target="_blank"
          locale={locale}
          className="p-4 rounded-xl border border-border text-start hover:border-primary hover:bg-primary/5 transition-all"
        >
          <p className="text-lg mb-1">👁</p>
          <p className="text-sm font-medium text-foreground">{locale === "ar" ? "معاينة" : "Preview"}</p>
          <p className="text-xs text-muted">{locale === "ar" ? "شاهد القائمة" : "See live menu"}</p>
        </Link>
      </div>
    </div>
  );
}
