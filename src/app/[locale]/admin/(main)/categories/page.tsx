import { getCategories } from "@/lib/actions/category";
import CategoriesClient from "./categories-client";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return <CategoriesClient categories={categories} />;
}
