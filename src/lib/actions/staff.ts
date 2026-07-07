"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type StaffAccount = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export async function createStaffAccount(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: StaffAccount }> {
  try {
    await requireSuperAdmin();
  } catch {
    return { success: false, error: "UNAUTHORIZED" };
  }

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "staff" },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Failed to create user" };
    }

    revalidatePath("/admin/settings");

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at ?? null,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create staff account" };
  }
}

export async function listStaffAccounts(): Promise<{
  success: boolean;
  error?: string;
  users?: StaffAccount[];
}> {
  try {
    await requireSuperAdmin();
  } catch {
    return { success: false, error: "UNAUTHORIZED" };
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const staffUsers: StaffAccount[] = [];
    for (const u of data.users) {
      if (u.app_metadata?.role === "staff") {
        staffUsers.push({
          id: u.id,
          email: u.email!,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        });
      }
    }

    return { success: true, users: staffUsers };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch staff accounts" };
  }
}

export async function deleteStaffAccount(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
  } catch {
    return { success: false, error: "UNAUTHORIZED" };
  }

  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  const admin = createAdminClient();

  try {
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete staff account" };
  }
}
