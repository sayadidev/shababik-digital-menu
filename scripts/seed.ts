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
      { name_en: "Main Courses", name_ar: "وجبات رئيسية", order_index: 4 },
      { name_en: "Fresh Juices", name_ar: "عصائر طازجة", order_index: 5 },
      { name_en: "Smoothies", name_ar: "سموذي", order_index: 6 },
      { name_en: "Breakfast", name_ar: "فطور", order_index: 7 },
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
        description_ar: "منقوع ببطء لمدة 18 ساعة — حلو طبيعياً، قليل الحموضة، وقوي.",
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
      // ── Main Courses ─────────────────────────────────────────────────
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
      // ── Fresh Juices ─────────────────────────────────────────────────
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
      // ── Smoothies ────────────────────────────────────────────────────
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
      // ── Breakfast ────────────────────────────────────────────────────
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
    // Chicken Shawarma
    { item_name: "Chicken Shawarma", size_en: "Wrap", size_ar: "ساندويش", usd: 4.0, syp: 55000 },
    { item_name: "Chicken Shawarma", size_en: "Plate", size_ar: "طبق", usd: 7.0, syp: 95000 },
    // Mixed Grill
    { item_name: "Mixed Grill", size_en: "For One", size_ar: "فردي", usd: 9.0, syp: 120000 },
    { item_name: "Mixed Grill", size_en: "For Two", size_ar: "لشخصين", usd: 16.0, syp: 220000 },
    // Mansaf
    { item_name: "Mansaf", size_en: "Regular", size_ar: "عادي", usd: 8.0, syp: 110000 },
    { item_name: "Mansaf", size_en: "Large", size_ar: "كبير", usd: 12.0, syp: 165000 },
    // Falafel Plate
    { item_name: "Falafel Plate", size_en: "Regular", size_ar: "عادي", usd: 3.5, syp: 45000 },
    { item_name: "Falafel Plate", size_en: "Large", size_ar: "كبير", usd: 5.5, syp: 70000 },
    // Orange Juice
    { item_name: "Orange Juice", size_en: "Small", size_ar: "صغير", usd: 2.5, syp: 30000 },
    { item_name: "Orange Juice", size_en: "Large", size_ar: "كبير", usd: 4.0, syp: 50000 },
    // Lemon Mint
    { item_name: "Lemon Mint", size_en: "Small", size_ar: "صغير", usd: 2.0, syp: 25000 },
    { item_name: "Lemon Mint", size_en: "Large", size_ar: "كبير", usd: 3.5, syp: 45000 },
    // Pomegranate Juice
    { item_name: "Pomegranate Juice", size_en: "Small", size_ar: "صغير", usd: 3.0, syp: 40000 },
    { item_name: "Pomegranate Juice", size_en: "Large", size_ar: "كبير", usd: 5.0, syp: 65000 },
    // Strawberry Smoothie
    { item_name: "Strawberry Smoothie", size_en: "Medium", size_ar: "وسط", usd: 4.5, syp: 60000 },
    { item_name: "Strawberry Smoothie", size_en: "Large", size_ar: "كبير", usd: 6.0, syp: 80000 },
    // Mango Smoothie
    { item_name: "Mango Smoothie", size_en: "Medium", size_ar: "وسط", usd: 4.5, syp: 60000 },
    { item_name: "Mango Smoothie", size_en: "Large", size_ar: "كبير", usd: 6.0, syp: 80000 },
    // Shakshuka
    { item_name: "Shakshuka", size_en: "Single", size_ar: "فردي", usd: 4.5, syp: 60000 },
    { item_name: "Shakshuka", size_en: "Double", size_ar: "مزدوج", usd: 7.0, syp: 95000 },
    // Manakeesh Zaatar
    { item_name: "Manakeesh Zaatar", size_en: "Single", size_ar: "قطعة", usd: 2.5, syp: 30000 },
    { item_name: "Manakeesh Zaatar", size_en: "Double", size_ar: "قطعتين", usd: 4.5, syp: 55000 },
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
