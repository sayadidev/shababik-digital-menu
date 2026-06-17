# Product Requirements Document (PRD): Shababik Digital Menu 

## 1. Executive Summary
**Product Name:** Shababik Menu App  
**Objective:** A fast-loading, mobile-first, QR-code-accessed digital menu for "شبابيك" (Shababik) Cafe. The app solves the friction of fluctuating exchange rates by allowing admin staff to manage dual-currency pricing (USD and SYP) in real-time, while providing a seamless, bilingual (Arabic/English) viewing experience for seated customers.

## 2. Target Audience
* **End-Users (Customers):** Cafe patrons scanning a QR code at their table to view the menu on mobile devices.
* **Admins (Cafe Staff/Management):** Users accessing a secure dashboard to manage menu items, prices, and availability on the fly.

## 3. Scope & Constraints
* **Hardcoded Branding:** The cafe's logo, typography, and brand colors are hardcoded into the application frontend. The admin does not have theme-editing capabilities.
* **View-Only:** Customers cannot add items to a cart or checkout digitally. 
* **Bilingual:** Fully supports Arabic (RTL) and English (LTR).

---

## 4. Core Features & Requirements

### 4.1 Customer-Facing Menu (Frontend)
* **Instant Load & Optimization:** The menu must load instantly on cellular networks. Images must be lazy-loaded.
* **Language Toggle:** A persistent button allowing users to switch between Arabic and English.
* **Dynamic Categories:** Items are grouped by custom categories (e.g., Hot Drinks, Desserts, Iced Coffee) defined by the admin.
* **Item Cards:** Each item displays:
    * Optimized thumbnail/image.
    * Item Name (in active language).
    * Description (in active language).
    * Pricing: Explicitly showing both USD and SYP alongside each other.
    * Variants: If an item has multiple sizes (e.g., Medium / Large), both sizes and their respective dual-currency prices are displayed.
* **Bestseller Highlight:** Items flagged by the admin as "الأكثر طلباً" feature a distinct visual badge and are pinned to the top of their respective categories.
* **Stock State:** Items marked "Out of Stock" are hidden entirely from the customer view to prevent order friction.

### 4.2 Admin Dashboard (Backend/CMS)
* **Authentication:** Secure login for cafe management.
* **Analytics Overview:** * Dashboard widget displaying "Menu Views Today" and "Menu Views This Week".
    * "Trending Items" suggestion widget showing which items are getting the most taps/views.
* **Menu & Category Management:** * Create, Read, Update, Delete (CRUD) custom categories.
    * CRUD menu items.
* **Item Data Entry:** For each item, the admin must input:
    * Name (English & Arabic).
    * Description (English & Arabic).
    * Image upload (system must auto-compress upon upload).
    * Category assignment.
    * Pricing/Sizes: Ability to add one or multiple sizes. For each size, the admin manually inputs both the USD and SYP values.
* **Quick Toggles:**
    * **In-Stock Toggle:** Temporarily hide/show an item without deleting it.
    * **Bestseller Toggle:** Manually pin an item to the top of the customer menu as "الأكثر طلباً" (guided by the analytics suggestions).

---

## 5. Data Architecture (Suggested Schema)

**`Category` Model**
* `id`
* `name_en` (String)
* `name_ar` (String)
* `order_index` (Integer - for sorting)

**`Item` Model**
* `id`
* `category_id` (Foreign Key)
* `name_en` (String)
* `name_ar` (String)
* `description_en` (Text)
* `description_ar` (Text)
* `image_url` (String)
* `is_active` (Boolean - Out of stock toggle)
* `is_bestseller` (Boolean - Pinned as الأكثر طلباً)
* `view_count` (Integer - for tracking popularity)

**`Item_Variant` Model (Sizes/Prices)**
* `id`
* `item_id` (Foreign Key)
* `size_name_en` (String - e.g., "Regular")
* `size_name_ar` (String - e.g., "عادي")
* `price_usd` (Decimal/Float)
* `price_syp` (Integer)

**`Analytics_Event` Model**
* `id`
* `event_type` (Enum: "menu_load", "item_tap")
* `item_id` (Nullable Foreign Key)
* `timestamp` (DateTime)

---

## 6. Success Metrics for Launch
1.  **Zero-Friction Updates:** The admin can update the SYP price of an item in under 30 seconds from their phone.
2.  **Performance:** The customer menu achieves a Google Lighthouse performance score of 90+ on mobile.
3.  **Adoption:** The analytics dashboard successfully registers QR scans and item interactions during the first week of deployment.
