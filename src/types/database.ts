export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  order_index: number;
  created_at?: string;
}

export interface Item {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image_url: string;
  is_active: boolean;
  is_bestseller: boolean;
  view_count: number;
  created_at?: string;
}

export interface ItemVariant {
  id: string;
  item_id: string;
  size_name_en: string;
  size_name_ar: string;
  price_usd: number;
  price_syp: number;
  created_at?: string;
}

export type AnalyticsEventType = "menu_load" | "item_tap";

export interface AnalyticsEvent {
  id: string;
  event_type: AnalyticsEventType;
  item_id?: string | null;
  timestamp: string;
}

export type Locale = "en" | "ar";
