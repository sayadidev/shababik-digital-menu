import { createClient } from "@/lib/supabase/server";
import type { Category, ItemVariant, ItemImage, SiteSettings } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ItemWithVariants = {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image_url: string;
  is_active: boolean;
  is_bestseller: boolean;
  is_offer: boolean;
  offer_position: number | null;
  view_count: number;
  item_variants: ItemVariant[];
  item_images: ItemImage[];
};

export type MenuCategory = Category & {
  items: ItemWithVariants[];
};

export type MenuData = {
  categories: MenuCategory[];
  settings: SiteSettings | null;
};

// ─── Data fetching ───────────────────────────────────────────────────────────

export async function getMenuData(): Promise<MenuData> {
  const supabase = await createClient();

  // 1. Fetch categories ordered by order_index
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("order_index", { ascending: true });

  // 2. Fetch all active items with their variants and gallery images
  const { data: items } = await supabase
    .from("items")
    .select("*, item_variants(*), item_images(*)")
    .eq("is_active", true);

  // 3. Group items by category, bestsellers first
  const grouped = new Map<string, ItemWithVariants[]>();

  for (const item of items ?? []) {
    const list = grouped.get(item.category_id) ?? [];
    list.push(item as unknown as ItemWithVariants);
    grouped.set(item.category_id, list);
  }

  // Sort items: bestsellers first, then by name_en
  for (const [, list] of grouped) {
    list.sort((a, b) => {
      if (a.is_bestseller !== b.is_bestseller) {
        return a.is_bestseller ? -1 : 1;
      }
      return a.name_en.localeCompare(b.name_en);
    });
  }

  // 4. Fetch site settings
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // 5. Compose: only include categories that have active items
  const categoriesWithItems = (categories ?? [])
    .map((cat) => ({
      ...cat,
      items: grouped.get(cat.id) ?? [],
    }))
    .filter((cat) => cat.items.length > 0);

  return { categories: categoriesWithItems, settings };
}

// ─── Single item fetch for detail view ───────────────────────────────────────

export async function getItemById(
  itemId: string,
): Promise<ItemWithVariants | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("items")
    .select("*, item_variants(*), item_images(*)")
    .eq("id", itemId)
    .single();

  return data as unknown as ItemWithVariants | null;
}
