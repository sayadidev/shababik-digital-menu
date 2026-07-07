"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ToggleButton, OfferPositionSelect, DeleteButton } from "./items-client";
import type { CategoryRow } from "@/lib/validations";

type ItemData = {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  is_active: boolean;
  is_bestseller: boolean;
  is_offer: boolean;
  offer_position: number | null;
  view_count: number;
  category_name_en: string;
  category_name_ar: string;
};

export default function ItemsList({
  items,
  categories,
}: {
  items: ItemData[];
  categories: CategoryRow[];
}) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.name_en.toLowerCase().includes(q) ||
        item.name_ar.includes(q) ||
        item.description_en?.toLowerCase().includes(q) ||
        item.description_ar?.includes(q)
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { category: CategoryRow; items: ItemData[] }>();
    for (const item of filteredItems) {
      const cat = categories.find((c) => c.id === item.category_id);
      if (!cat) continue;
      if (!map.has(cat.id)) {
        map.set(cat.id, { category: cat, items: [] });
      }
      map.get(cat.id)!.items.push(item);
    }
    return Array.from(map.values());
  }, [filteredItems, categories]);

  const SearchIcon = (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <div>
      <div className="relative mb-6">
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
          {SearchIcon}
        </span>
        <input
          type="text"
          placeholder={t("Search items (Arabic or English)...", "ابحث عن صنف (عربي أو إنجليزي)...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8C6B4A] outline-none transition-all bg-white"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
          <p className="text-muted text-sm">
            {search.trim()
              ? t("No items match your search.", "لا توجد أصناف تطابق بحثك.")
              : t("No items yet. Create your first one.", "لا توجد أصناف بعد. أنشئ الصنف الأول.")}
          </p>
        </div>
      ) : (
        grouped.map(({ category, items: catItems }) => (
          <div key={category.id} className="mb-8">
            <h3 className="text-lg font-bold text-[#3C3025] mb-3 pb-2 border-b-2 border-[#E8E6E1]">
              {locale === "ar" ? category.name_ar : category.name_en}{" "}
              <span className="text-sm text-gray-500 font-normal">({catItems.length})</span>
            </h3>
            <div className="flex flex-col gap-3">
              <div className="hidden md:block bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-start px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Name", "الاسم")}</th>
                        <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Views", "المشاهدات")}</th>
                        <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Active", "نشط")}</th>
                        <th className="text-center px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Hero", "الهيرو")}</th>
                        <th className="text-end px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">{t("Actions", "إجراءات")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-primary/5 transition-colors">
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-medium text-foreground">{item.name_en}</p>
                              <p className="text-xs text-muted">{item.name_ar}</p>
                            </div>
                          </td>
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
              </div>

              <div className="md:hidden bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] overflow-hidden divide-y divide-border/50">
                {catItems.map((item) => (
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
                    <p className="text-xs text-muted">{item.view_count} {t("views", "مشاهدة")}</p>
                    <div className="flex gap-2 pt-1">
                      <Link href={`/admin/items/${item.id}/edit`} locale={locale} className="text-xs text-primary font-medium">{t("Edit", "تعديل")}</Link>
                      <DeleteButton item={item} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
