const STORAGE_KEY = "menu_last_viewed_at";
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export async function trackMenuLoad() {
  if (typeof window === "undefined") return;

  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last) {
      const elapsed = Date.now() - Number(last);
      if (elapsed < COOLDOWN_MS) return;
    }
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable — still fire the event
  }

  const { trackEvent } = await import("@/lib/actions/analytics");
  await trackEvent("menu_load");
}
