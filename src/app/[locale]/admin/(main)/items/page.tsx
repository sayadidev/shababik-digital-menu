import { getItems } from "@/lib/actions/item";
import { getCategories } from "@/lib/actions/category";
import ItemsList from "@/components/admin/ItemsList";

export default async function ItemsPage() {
  const items = await getItems();
  const categories = await getCategories();

  return <ItemsList items={items} categories={categories} />;
}
