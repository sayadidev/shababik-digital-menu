import dynamic from "next/dynamic";
import { getCategories } from "@/lib/actions/category";

const ItemForm = dynamic(() => import("@/components/admin/ItemForm"), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
    </div>
  ),
});

export default async function NewItemPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <ItemForm categories={categories} />
    </div>
  );
}
