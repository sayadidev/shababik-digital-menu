import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Composed middleware:
 *  1. Refreshes Supabase auth session (handles cookie rotation).
 *  2. Protects admin routes — redirects unauthenticated users to login.
 *  3. Delegates locale routing to next-intl.
 *
 * Auth cookies from step 1 are carefully merged into the final response so
 * that the browser receives both the locale-negotiated response AND the
 * refreshed session cookie.
 */
export default async function middleware(request: NextRequest) {
  // ── 1. Session refresh & auth check ──────────────────────────────────────
  const { user, response: authRes } = await updateSession(request);

  // ── 2. Admin route protection ────────────────────────────────────────────
  const { pathname } = request.nextUrl;

  // Extract the path after any locale prefix (en / ar)
  const localeMatch = pathname.match(/^\/(en|ar)(\/|$)/);
  const locale = localeMatch?.[1];
  const pathAfterLocale = locale
    ? pathname.slice(`/${locale}`.length) || "/"
    : pathname;

  const isAdminRoute =
    pathAfterLocale === "/admin" || pathAfterLocale.startsWith("/admin/");

  // Special case: the login page itself must be accessible without auth
  const isLoginPage =
    pathAfterLocale === "/admin/login" || pathAfterLocale === "/admin/login/";

  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = new URL(
      `/${locale || routing.defaultLocale}/admin/login`,
      request.url,
    );
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Locale routing via next-intl ──────────────────────────────────────
  const intlResponse = intlMiddleware(request);

  // ── 4. Merge auth cookies into the intl response ─────────────────────────
  // The auth response carries refreshed session cookies.  We must transfer
  // them to the response that will actually be sent to the browser.
  for (const cookie of authRes.cookies.getAll()) {
    const { name, value, ...options } = cookie;
    intlResponse.cookies.set(name, value, options);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
