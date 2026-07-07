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
  is_offer: boolean;
  offer_position: number | null;
  view_count: number;
  created_at?: string;
}

export interface ItemVariant {
  id: string;
  item_id: string;
  size_name_en: string;
  size_name_ar: string;
  price_usd: number | null;
  price_syp: number | null;
  price_try: number | null;
  is_offer: boolean;
  price_before_usd: number | null;
  price_before_syp: number | null;
  created_at?: string;
}

export type AnalyticsEventType = "menu_load" | "item_tap";

export interface AnalyticsEvent {
  id: string;
  event_type: AnalyticsEventType;
  item_id?: string | null;
  timestamp: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
}

export type Currency = "TRY" | "USD" | "SYP";

export interface SiteSettings {
  id: number;
  hero_image_url: string;
  hero_logo_url: string;
  header_logo_url: string;
  tier: "basic" | "pro";
  ordering_enabled: boolean;
  enable_usd: boolean;
  active_currency: Currency;
  created_at?: string;
  updated_at?: string;
}

export type Locale = "en" | "ar";
