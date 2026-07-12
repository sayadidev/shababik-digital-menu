/**
 * Add new categories and items to existing menu.
 * Usage: npx tsx scripts/add-new-menu.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE env vars. Ensure .env.local is loaded.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Adding new categories and items...\n");

  // Get current max order_index
  const { data: existingCats } = await admin
    .from("categories")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrderIdx = existingCats?.length
    ? existingCats[0].order_index + 1
    : 0;

  // ── New Categories ─────────────────────────────────────────────────────
  const { data: cats, error: catErr } = await admin
    .from("categories")
    .insert([
      { name_en: "Main Courses", name_ar: "وجبات رئيسية", order_index: nextOrderIdx },
      { name_en: "Fresh Juices", name_ar: "عصائر طازجة", order_index: nextOrderIdx + 1 },
      { name_en: "Smoothies", name_ar: "سموذي", order_index: nextOrderIdx + 2 },
      { name_en: "Breakfast", name_ar: "فطور", order_index: nextOrderIdx + 3 },
    ])
    .select();

  if (catErr) {
    console.error("Failed to insert categories:", catErr);
    process.exit(1);
  }
  console.log(`✓ ${cats.length} categories created`);

  const catMap = Object.fromEntries((cats as any[]).map((c) => [c.name_en, c.id]));

  // ── New Items ─────────────────────────────────────────────────────────
  const { data: items, error: itemErr } = await admin
    .from("items")
    .insert([
      {
        category_id: catMap["Main Courses"],
        name_en: "Chicken Shawarma",
        name_ar: "شاورما دجاج",
        description_en: "Marinated chicken slices slow-roasted on a vertical spit, served with garlic sauce and pickles.",
        description_ar: "شرائح دجاج متبلة مشوية ببطء على سيخ عمودي، تقدم مع صلصة الثوم والمخللات.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Main Courses"],
        name_en: "Mixed Grill",
        name_ar: "مشاوي مشكلة",
        description_en: "Skewers of tender lamb, chicken, and kofta, chargrilled and served with grilled vegetables.",
        description_ar: "أسياخ من لحم الضأن الطري والدجاج والكفتة، مشوية على الفحم وتقدم مع خضار مشوية.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Main Courses"],
        name_en: "Mansaf",
        name_ar: "منسف",
        description_en: "Jordanian national dish — tender lamb served over aromatic rice with jameed yogurt sauce, garnished with almonds.",
        description_ar: "الطبق الوطني الأردني — لحم ضأن طري يقدم فوق أرز معطر مع صلصة الجميد، مزين باللوز.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Main Courses"],
        name_en: "Falafel Plate",
        name_ar: "طبق فلافل",
        description_en: "Crispy fried chickpea patties served with hummus, tahini, pickled turnips, and warm pita bread.",
        description_ar: "أقراص حمص مقلية ومقرمشة تقدم مع حمص وطحينة ولفت مخلل وخبز بيتا دافئ.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Fresh Juices"],
        name_en: "Orange Juice",
        name_ar: "عصير برتقال",
        description_en: "Freshly squeezed sweet oranges — no sugar added, served ice cold.",
        description_ar: "برتقال حلو طازج معصور — بدون سكر مضاف، يقدم مثلجاً.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Fresh Juices"],
        name_en: "Lemon Mint",
        name_ar: "ليمون بالنعناع",
        description_en: "Zesty fresh lemon juice blended with muddled mint leaves and a hint of sugar — ultra refreshing.",
        description_ar: "عصير ليمون طازج منعش ممزوج بأوراق النعناع المدقوقة ولمسة سكر — منعش للغاية.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Fresh Juices"],
        name_en: "Pomegranate Juice",
        name_ar: "عصير رمان",
        description_en: "Pure pressed pomegranate juice — tart, sweet, and packed with antioxidants.",
        description_ar: "عصير رمان طبيعي معصور — حامض وحلو وغني بمضادات الأكسدة.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Smoothies"],
        name_en: "Strawberry Smoothie",
        name_ar: "سموذي فراولة",
        description_en: "Fresh strawberries blended with creamy yogurt, honey, and ice — thick and velvety.",
        description_ar: "فراولة طازجة ممزوجة مع لبن زبادي كريمي وعسل وثلج — كثيفة وناعمة.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Smoothies"],
        name_en: "Mango Smoothie",
        name_ar: "سموذي مانجو",
        description_en: "Ripe mangoes blended with milk, a touch of honey, and crushed ice — a tropical treat.",
        description_ar: "مانجو ناضج ممزوج مع حليب ولمسة عسل وثلج مجروش — متعة استوائية.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Breakfast"],
        name_en: "Shakshuka",
        name_ar: "شكشوكة",
        description_en: "Poached eggs in a spiced tomato and bell pepper sauce with cumin, paprika, and fresh herbs. Served with warm bread.",
        description_ar: "بيض مسلوق في صلصة طماطم وفلفل حلو متبلة بالكمون والبابريكا والأعشاب الطازجة. يقدم مع خبز دافئ.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Breakfast"],
        name_en: "Manakeesh Zaatar",
        name_ar: "مناقيش زعتر",
        description_en: "Freshly baked flatbread topped with zaatar spice blend, olive oil, and sesame seeds — baked in a stone oven.",
        description_ar: "خبز مسطح مخبوز طازج مغطى بخليط الزعتر وزيت الزيتون وبذور السمسم — مخبوز في فرن حجري.",
        image_url: "",
        is_bestseller: false,
      },
    ])
    .select();

  if (itemErr) {
    console.error("Failed to insert items:", itemErr);
    process.exit(1);
  }
  console.log(`✓ ${items.length} items created`);

  const itemByName = Object.fromEntries(
    (items as any[]).map((i) => [i.name_en, i.id]),
  );

  // ── New Variants ──────────────────────────────────────────────────────
  const variants = [
    { item_name: "Chicken Shawarma", size_en: "Wrap", size_ar: "ساندويش", usd: 4.0, syp: 55000 },
    { item_name: "Chicken Shawarma", size_en: "Plate", size_ar: "طبق", usd: 7.0, syp: 95000 },
    { item_name: "Mixed Grill", size_en: "For One", size_ar: "فردي", usd: 9.0, syp: 120000 },
    { item_name: "Mixed Grill", size_en: "For Two", size_ar: "لشخصين", usd: 16.0, syp: 220000 },
    { item_name: "Mansaf", size_en: "Regular", size_ar: "عادي", usd: 8.0, syp: 110000 },
    { item_name: "Mansaf", size_en: "Large", size_ar: "كبير", usd: 12.0, syp: 165000 },
    { item_name: "Falafel Plate", size_en: "Regular", size_ar: "عادي", usd: 3.5, syp: 45000 },
    { item_name: "Falafel Plate", size_en: "Large", size_ar: "كبير", usd: 5.5, syp: 70000 },
    { item_name: "Orange Juice", size_en: "Small", size_ar: "صغير", usd: 2.5, syp: 30000 },
    { item_name: "Orange Juice", size_en: "Large", size_ar: "كبير", usd: 4.0, syp: 50000 },
    { item_name: "Lemon Mint", size_en: "Small", size_ar: "صغير", usd: 2.0, syp: 25000 },
    { item_name: "Lemon Mint", size_en: "Large", size_ar: "كبير", usd: 3.5, syp: 45000 },
    { item_name: "Pomegranate Juice", size_en: "Small", size_ar: "صغير", usd: 3.0, syp: 40000 },
    { item_name: "Pomegranate Juice", size_en: "Large", size_ar: "كبير", usd: 5.0, syp: 65000 },
    { item_name: "Strawberry Smoothie", size_en: "Medium", size_ar: "وسط", usd: 4.5, syp: 60000 },
    { item_name: "Strawberry Smoothie", size_en: "Large", size_ar: "كبير", usd: 6.0, syp: 80000 },
    { item_name: "Mango Smoothie", size_en: "Medium", size_ar: "وسط", usd: 4.5, syp: 60000 },
    { item_name: "Mango Smoothie", size_en: "Large", size_ar: "كبير", usd: 6.0, syp: 80000 },
    { item_name: "Shakshuka", size_en: "Single", size_ar: "فردي", usd: 4.5, syp: 60000 },
    { item_name: "Shakshuka", size_en: "Double", size_ar: "مزدوج", usd: 7.0, syp: 95000 },
    { item_name: "Manakeesh Zaatar", size_en: "Single", size_ar: "قطعة", usd: 2.5, syp: 30000 },
    { item_name: "Manakeesh Zaatar", size_en: "Double", size_ar: "قطعتين", usd: 4.5, syp: 55000 },
  ];

  const variantRows = variants.map((v) => ({
    item_id: itemByName[v.item_name],
    size_name_en: v.size_en,
    size_name_ar: v.size_ar,
    price_usd: v.usd,
    price_syp: v.syp,
  }));

  const validVariants = variantRows.filter((v) => v.item_id);
  const skipped = variantRows.length - validVariants.length;

  const { error: varErr } = await admin
    .from("item_variants")
    .insert(validVariants);

  if (varErr) {
    console.error("Failed to insert variants:", varErr);
    process.exit(1);
  }
  console.log(`✓ ${validVariants.length} variants created${skipped ? ` (${skipped} skipped)` : ""}`);

  console.log("\n✅ Done! Added 4 categories, 11 items, 22 variants.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
