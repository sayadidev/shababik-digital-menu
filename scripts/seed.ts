/**
 * Seed the database with sample categories, items, and variants.
 *
 * Usage: npx tsx scripts/seed.ts
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

async function seed() {
  console.log("🌱 Seeding Shababik Cafe menu...\n");

  // ── Categories ──────────────────────────────────────────────────────────
  const { data: cats, error: catErr } = await admin
    .from("categories")
    .insert([
      { name_en: "Hot Drinks", name_ar: "مشروبات ساخنة", order_index: 0 },
      { name_en: "Iced Coffee", name_ar: "قهوة مثلجة", order_index: 1 },
      { name_en: "Desserts", name_ar: "حلويات", order_index: 2 },
      { name_en: "Appetizers", name_ar: "مقبلات", order_index: 3 },
    ])
    .select();

  if (catErr) {
    console.error("Failed to insert categories:", catErr);
    process.exit(1);
  }
  console.log(`✓ ${cats.length} categories created`);

  const catMap = Object.fromEntries(cats.map((c: any) => [c.name_en, c.id]));

  // ── Items ───────────────────────────────────────────────────────────────

  const { data: items, error: itemErr } = await admin
    .from("items")
    .insert([
      {
        category_id: catMap["Hot Drinks"],
        name_en: "Arabic Coffee",
        name_ar: "قهوة عربية",
        description_en: "Traditional Arabic coffee with cardamom — rich, aromatic, and served with dates.",
        description_ar: "قهوة عربية تقليدية مع الهيل — غنية بالرائحة والنكهة، تقدم مع التمر.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Hot Drinks"],
        name_en: "Tea with Mint",
        name_ar: "شاي بالنعناع",
        description_en: "Fresh green tea leaves steeped with mint leaves and a touch of sugar.",
        description_ar: "أوراق شاي أخضر طازج منقوع مع أوراق النعناع ولمسة سكر.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Hot Drinks"],
        name_en: "Turkish Coffee",
        name_ar: "قهوة تركية",
        description_en: "Finely ground coffee brewed in a cezve — thick, strong, and unfiltered.",
        description_ar: "قهوة مطحونة ناعماً مخمرة في ركوة — كثيفة وقوية وغير مفلترة.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Iced Coffee"],
        name_en: "Iced Latte",
        name_ar: "لاتيه مثلج",
        description_en: "Espresso poured over cold milk and ice — smooth and refreshing.",
        description_ar: "إسبرسو يُسكب فوق حليب بارد وثلج — ناعم ومنعش.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Iced Coffee"],
        name_en: "Cold Brew",
        name_ar: "كولد برو",
        description_en: "Slow-steeped for 18 hours — naturally sweet, low-acid, and bold.",
        description_ar: "منقوع ببطء لمدة ١٨ ساعة — حلو طبيعياً، قليل الحموضة، وقوي.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Iced Coffee"],
        name_en: "Mocha Frappe",
        name_ar: "موكا فرابيه",
        description_en: "Blended coffee with chocolate syrup, milk, and whipped cream on top.",
        description_ar: "قهوة ممزوجة مع شراب الشوكولاتة والحليب والكريمة المخفوقة في الأعلى.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Desserts"],
        name_en: "Kunafa",
        name_ar: "كنافة",
        description_en: "Shredded phyllo pastry filled with creamy cheese, soaked in sweet syrup — served hot.",
        description_ar: "عجينة فيلو مبروشة محشوة بالجبنة الكريمية، مغموسة بالقطر الحلو — تقدم ساخنة.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Desserts"],
        name_en: "Baklava Plate",
        name_ar: "طبق بقلاوة",
        description_en: "Layers of buttery phyllo filled with walnuts and pistachios, drizzled with honey.",
        description_ar: "طبقات من الفيلو بالزبدة محشوة بالجوز والفستق، مغطاة بالعسل.",
        image_url: "",
        is_bestseller: false,
      },
      {
        category_id: catMap["Appetizers"],
        name_en: "Hummus",
        name_ar: "حمص",
        description_en: "Smooth chickpea dip with tahini, lemon, and olive oil — served with warm pita.",
        description_ar: "غموس حمص ناعم مع طحينة وليمون وزيت زيتون — يقدم مع خبز بيتا دافئ.",
        image_url: "",
        is_bestseller: true,
      },
      {
        category_id: catMap["Appetizers"],
        name_en: "Fattoush Salad",
        name_ar: "سلطة فتوش",
        description_en: "Crisp mixed greens with fried pita chips, sumac, and pomegranate molasses dressing.",
        description_ar: "خضار مشكلة مقرمشة مع رقائق بيتا مقلية، سماق، وخل الرمان.",
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

  const itemMap = Object.fromEntries(
    items.map((i: any) => [`${i.category_id}-${i.name_en}`, i.id]),
  );

  // ── Variants ────────────────────────────────────────────────────────────

  const variants = [
    // Arabic Coffee — Regular
    { item_name: "Arabic Coffee", size_en: "Regular", size_ar: "عادي", usd: 2.5, syp: 35000 },
    { item_name: "Arabic Coffee", size_en: "Large", size_ar: "كبير", usd: 3.5, syp: 50000 },
    // Tea with Mint
    { item_name: "Tea with Mint", size_en: "Regular", size_ar: "عادي", usd: 1.5, syp: 20000 },
    { item_name: "Tea with Mint", size_en: "Large", size_ar: "كبير", usd: 2.0, syp: 30000 },
    // Turkish Coffee
    { item_name: "Turkish Coffee", size_en: "Cup", size_ar: "فنجان", usd: 2.0, syp: 25000 },
    // Iced Latte
    { item_name: "Iced Latte", size_en: "Medium", size_ar: "وسط", usd: 3.5, syp: 45000 },
    { item_name: "Iced Latte", size_en: "Large", size_ar: "كبير", usd: 4.5, syp: 60000 },
    // Cold Brew
    { item_name: "Cold Brew", size_en: "Medium", size_ar: "وسط", usd: 4.0, syp: 55000 },
    { item_name: "Cold Brew", size_en: "Large", size_ar: "كبير", usd: 5.0, syp: 70000 },
    // Mocha Frappe
    { item_name: "Mocha Frappe", size_en: "Medium", size_ar: "وسط", usd: 4.5, syp: 60000 },
    { item_name: "Mocha Frappe", size_en: "Large", size_ar: "كبير", usd: 5.5, syp: 75000 },
    // Kunafa
    { item_name: "Kunafa", size_en: "Single", size_ar: "فردي", usd: 4.0, syp: 55000 },
    { item_name: "Kunafa", size_en: "Platter", size_ar: "طبق", usd: 7.0, syp: 100000 },
    // Baklava Plate
    { item_name: "Baklava Plate", size_en: "Small", size_ar: "صغير", usd: 5.0, syp: 70000 },
    { item_name: "Baklava Plate", size_en: "Large", size_ar: "كبير", usd: 8.0, syp: 110000 },
    // Hummus
    { item_name: "Hummus", size_en: "Regular", size_ar: "عادي", usd: 3.0, syp: 40000 },
    { item_name: "Hummus", size_en: "Large", size_ar: "كبير", usd: 5.0, syp: 65000 },
    // Fattoush Salad
    { item_name: "Fattoush Salad", size_en: "Regular", size_ar: "عادي", usd: 3.5, syp: 45000 },
    { item_name: "Fattoush Salad", size_en: "Large", size_ar: "كبير", usd: 5.5, syp: 75000 },
  ];

  // Map item_name to the correct item_id by finding from our inserted items
  const itemByName = Object.fromEntries(
    items.map((i: any) => [i.name_en, i.id]),
  );

  const variantRows = variants.map((v) => ({
    item_id: itemByName[v.item_name],
    size_name_en: v.size_en,
    size_name_ar: v.size_ar,
    price_usd: v.usd,
    price_syp: v.syp,
  }));

  // Filter out any that didn't map
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

  console.log("\n✅ Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
