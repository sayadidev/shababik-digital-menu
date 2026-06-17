"use client";

import { useLocale } from "next-intl";
import ItemCard from "./ItemCard";
import type { MenuCategory } from "@/lib/menu";

type Props = {
  category: MenuCategory;
  sectionRef: React.RefCallback<HTMLDivElement>;
};

export default function CategorySection({
  category,
  sectionRef,
}: Props) {
  const locale = useLocale();
  const name = locale === "ar" ? category.name_ar : category.name_en;

  return (
    <section
      id={`cat-${category.id}`}
      ref={sectionRef}
      data-category-id={category.id}
      className="mb-12 scroll-mt-28"
    >
      {/* Section header with decorative line */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="whitespace-nowrap text-lg font-bold text-foreground">
          {name}
        </h2>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <div className="space-y-3.5">
        {category.items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
