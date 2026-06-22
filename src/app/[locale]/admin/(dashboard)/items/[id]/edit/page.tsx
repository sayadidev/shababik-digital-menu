import { notFound } from "next/navigation";
import { getItem } from "@/lib/actions/item";
import { getCategories } from "@/lib/actions/category";
import EditItemForm from "./edit-form";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function EditItemPage({ params }: Props) {
  const { id, locale } = await params;

  const [item, categories] = await Promise.all([
    getItem(id).catch(() => null),
    getCategories().catch(() => []),
  ]);

  if (!item) notFound();

  return <EditItemForm item={item} categories={categories} locale={locale} />;
}
