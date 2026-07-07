import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import { getUserRole, type UserRole } from "@/lib/role-utils";

export { getUserRole, isStaff, isSuperAdmin } from "@/lib/role-utils";
export type { UserRole };

/**
 * Verify the user is authenticated by reading the auth cookie directly.
 * Returns the session, user role, and user email — or throws.
 * Use this in every admin server action as the first line.
 *
 * Usage:
 *   const { role, email } = await requireAuth();
 */
export async function requireAuth(): Promise<{
  sesion: Session;
  role: UserRole | null;
  email: string | null;
}> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("UNAUTHORIZED");
  }

  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("UNAUTHORIZED");

  const role = getUserRole(session);

  return {
    sesion: session,
    role,
    email: data.user.email ?? null,
  };
}

/**
 * Verify the caller is a super_admin.
 * Otherwise, throw UNAUTHORIZED.
 */
export async function requireSuperAdmin(): Promise<{
  sesion: Session;
  email: string | null;
}> {
  const auth = await requireAuth();
  if (auth.role !== "super_admin") {
    throw new Error("UNAUTHORIZED");
  }
  return auth;
}
