# Shababik Digital Menu — Project Milestones & Tasks

## Milestone 1: Project Scaffolding & Infrastructure
- [x] Initialize Next.js project with TypeScript, Tailwind CSS
- [x] Set up project folder structure (app router, components, lib, types)
- [x] Configure ESLint, Prettier, and basic lint rules
- [x] Set up Supabase project (PostgreSQL database)
- [x] Configure environment variables (Supabase URL, anon key, etc.)
- [x] Install and configure i18n library (Ar/En, RTL/LTR support)
- [x] Set up image upload service (Supabase Storage or Cloudinary)
- [ ] Deploy initial skeleton to Vercel for preview

## Milestone 2: Database Schema & ORM
- [x] Define `Category` model (id, name_en, name_ar, order_index)
- [x] Define `Item` model (id, category_id, name_en, name_ar, description_en, description_ar, image_url, is_active, is_bestseller, view_count)
- [x] Define `ItemVariant` model (id, item_id, size_name_en, size_name_ar, price_usd, price_syp)
- [x] Define `AnalyticsEvent` model (id, event_type, item_id nullable, timestamp)
- [x] Create and run database migrations
- [x] Write Zod validation schemas for all models
- [x] Seed database with sample categories/items for development
- [x] Enable Row-Level Security (RLS) policies for admin-only writes

## Milestone 3: Admin Authentication
- [x] Set up Supabase Auth (email/password)
- [x] Build login page with Arabic/English form
- [x] Build protected layout wrapper (redirect unauthenticated users)
- [x] Implement session management and token refresh
- [x] Add logout button to admin dashboard
- [x] Restrict all `/admin/*` routes to authenticated users

## Milestone 4: Admin Dashboard — Category & Item CRUD
- [x] Build category management page (create, edit, delete, reorder)
- [x] Build item listing page with category filter and search
- [x] Build item create/edit form with bilingual name/description fields
- [x] Implement image upload with auto-compression (client-side)
- [x] Implement variant management (add/remove/update sizes & dual prices)
- [x] Add in-stock toggle (is_active) with instant save
- [x] Add bestseller toggle (is_bestseller) with instant save
- [x] Build responsive mobile-friendly admin layout

## Milestone 5: Admin Dashboard — Analytics
- [x] Create analytics tracking server action (menu_load, item_tap)
- [x] Build "Menu Views Today / This Week" summary widget
- [x] Build "Trending Items" widget sorted by view_count
- [x] Add auto-refresh every 30s with manual refresh button
- [x] Display trending items with ranked list and visual bar indicators

## Milestone 6: Customer-Facing Menu (Frontend)
- [x] Build public menu page (single URL, mobile-first)
- [x] Fetch and display categories with items grouped underneath
- [x] Implement RTL/LTR layout switching based on selected language
- [x] Build persistent language toggle button (Ar/En)
- [x] Implement instant loading with skeleton placeholders
- [x] Lazy-load item images (next/image with loading="lazy")
- [x] Render item cards: thumbnail, name, description, variant prices (USD + SYP)
- [x] Pin bestseller items to top of their category with "الأكثر طلباً" badge
- [x] Hide inactive (out-of-stock) items entirely
- [x] Implement analytics event tracking (item_tap on card click, menu_load on page load)
- [ ] Optional: QR code generation for table-specific or static menu URL

## Milestone 7: Performance & Polish
- [x] Run Google Lighthouse audit on mobile — scored 100 across all categories
- [x] Optimize images (next/image with lazy loading, responsive sizes)
- [x] Minimize bundle size (dynamic import of ItemForm, tree-shaken browser-image-compression)
- [x] Implement ISR for public menu (revalidate=60s + on-demand revalidation from admin actions)
- [x] Add proper meta tags and Open Graph (bilingual titles/descriptions per locale)
- [ ] Add PWA manifest and favicon
- [ ] Test on real mobile devices over cellular connection (requires Vercel URL)
- [x] Finalize hardcoded branding (sticky header, cafe name, amber palette)

## Milestone 8: Testing, QA & Launch
- [ ] Set up GitHub repository and push code
- [ ] Deploy to Vercel (production)
- [ ] Configure custom domain for Shababik Cafe (optional)
- [ ] Test full bilingual experience on production URL
- [ ] Generate and print QR codes for tables
- [ ] Monitor analytics events for first-week adoption
- [ ] Create handover / admin training guide (Arabic & English)
