import { z } from "zod";

// ─── Helpers ────────────────────────────────────────────────────────────────
const uuidField = z.string().uuid("Must be a valid UUID");
const nonEmptyEnglish = z.string().min(1, "English text is required").max(255);
const nonEmptyArabic = z.string().min(1, "Arabic text is required").max(255);
const optionalEnglish = z.string().max(5000).default("");
const optionalArabic = z.string().max(5000).default("");

// ─── Category ───────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name_en: nonEmptyEnglish,
  name_ar: nonEmptyArabic,
  order_index: z.number().int().min(0).default(0),
});

export const categoryUpdateSchema = categorySchema.partial();

export const categoryRowSchema = categorySchema.extend({
  id: uuidField,
  created_at: z.string().datetime().optional(),
});

// ─── Item ───────────────────────────────────────────────────────────────────

export const itemSchema = z.object({
  category_id: uuidField,
  name_en: nonEmptyEnglish,
  name_ar: nonEmptyArabic,
  description_en: optionalEnglish,
  description_ar: optionalArabic,
  image_url: z.string().max(2048).default(""),
  is_active: z.boolean().default(true),
  is_bestseller: z.boolean().default(false),
  is_offer: z.boolean().default(false),
  offer_position: z.number().int().min(1).max(3).nullable().default(null),
  view_count: z.number().int().min(0).default(0),
});

export const itemUpdateSchema = itemSchema.partial();

export const itemRowSchema = itemSchema.extend({
  id: uuidField,
  created_at: z.string().datetime().optional(),
});

// ─── Item Variant ───────────────────────────────────────────────────────────

export const itemVariantSchema = z.object({
  item_id: uuidField,
  size_name_en: nonEmptyEnglish,
  size_name_ar: nonEmptyArabic,
  price_usd: z.number().min(0, "USD price cannot be negative"),
  price_syp: z
    .number()
    .int("SYP price must be a whole number")
    .min(0, "SYP price cannot be negative"),
});

export const itemVariantUpdateSchema = itemVariantSchema.partial();

export const itemVariantRowSchema = itemVariantSchema.extend({
  id: uuidField,
  created_at: z.string().datetime().optional(),
});

// ─── Analytics Event ────────────────────────────────────────────────────────

export const analyticsEventTypeSchema = z.enum(["menu_load", "item_tap"]);

export const analyticsEventSchema = z.object({
  event_type: analyticsEventTypeSchema,
  item_id: uuidField.nullable().optional(),
});

export const analyticsEventRowSchema = analyticsEventSchema.extend({
  id: uuidField,
  timestamp: z.string().datetime(),
});

// ─── Types (inferred from Zod) ──────────────────────────────────────────────

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryRow = z.infer<typeof categoryRowSchema>;

export type ItemInput = z.infer<typeof itemSchema>;
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
export type ItemRow = z.infer<typeof itemRowSchema>;

export type ItemVariantInput = z.infer<typeof itemVariantSchema>;
export type ItemVariantUpdate = z.infer<typeof itemVariantUpdateSchema>;
export type ItemVariantRow = z.infer<typeof itemVariantRowSchema>;

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type AnalyticsEventRow = z.infer<typeof analyticsEventRowSchema>;
