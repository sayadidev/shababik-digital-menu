# AGENTS.md — Shababik Digital Menu

## Authority

- **`Shababik_Menu_PRD.md`** is the source of truth for requirements, data schema, and constraints.
- **`tasks.md`** tracks milestone progress. Update it as work is completed.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage)
- i18n library for Arabic (RTL) / English (LTR)
- Image auto-compression on client-side upload
- Deploy: Vercel

## Key Constraints

| Constraint | Detail |
|---|---|
| **Pricing** | Every variant has both `price_usd` (float) and `price_syp` (integer). Neither is derived. |
| **Hidden items** | Out-of-stock (`is_active=false`) items are hidden entirely from customer view — not greyed out. |
| **Bestsellers** | Items with `is_bestseller=true` are pinned to top of their category with an "الأكثر طلباً" badge. |
| **View-only** | No cart or checkout — customer menu is read-only. |
| **Hardcoded branding** | Logo, colors, typography are hardcoded. No admin theming. |
| **Bilingual** | Every text field has `_en` and `_ar` variants stored separately, not via translation keys. |

## Models (from PRD §5)

`Category` → `Item` → `ItemVariant` (sizes/prices), plus `AnalyticsEvent` for tracking.

## Development Notes

- RLS on Supabase: admin-only writes, public reads on customer-facing queries.
- `view_count` on items is incremented via `AnalyticsEvent` inserts (item_tap events).
- Analytics dashboard shows "Menu Views Today / This Week" and "Trending Items".
- Static or ISR for the public menu page; admin routes are dynamic and protected.
- No tests written yet.
