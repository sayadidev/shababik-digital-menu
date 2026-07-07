import type { Session } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "staff";

export function getUserRole(session: Session | null): UserRole | null {
  if (!session) return null;
  const role = session.user.app_metadata?.role;
  if (role === "staff") return "staff";
  if (role === "super_admin") return "super_admin";
  return null;
}

export function isStaff(session: Session | null): boolean {
  return getUserRole(session) === "staff";
}

export function isSuperAdmin(session: Session | null): boolean {
  const role = getUserRole(session);
  return role === "super_admin";
}
