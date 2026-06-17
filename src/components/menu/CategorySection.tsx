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
      className="mb-10 scroll-mt-20"
    >
      <h2 className="mb-4 text-xl font-bold text-gray-900">{name}</h2>

      <div className="space-y-4">
        {category.items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
