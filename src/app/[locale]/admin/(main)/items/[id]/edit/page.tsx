import dynamic from "next/dynamic";
import { getCategories } from "@/lib/actions/category";
import { getItem } from "@/lib/actions/item";

const ItemForm = dynamic(() => import("@/components/admin/ItemForm"), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
    </div>
  ),
});

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditItemPage({ params }: Props) {
  const { id } = await params;
  const categories = await getCategories();
  const item = await getItem(id);

  return (
    <div className="mx-auto max-w-3xl">
      <ItemForm categories={categories} initialData={item} />
    </div>
  );
}
