import { revalidatePath } from "next/cache";

/**
 * Revalidate all paths related to the public menu.
 * Call this from every admin mutation that affects categories, items, or variants.
 */
export function revalidateMenuPaths() {
  // next-intl with localePrefix "as-needed" serves the menu at both /en and /ar
  revalidatePath("/en");
  revalidatePath("/ar");
  // Also cover root-level redirect (e.g. / -> /en)
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
