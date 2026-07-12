"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { requirePro } from "@/lib/actions/settings-public";
import { revalidatePath } from "next/cache";
import type { Table } from "@/types/database";

export async function getTables(): Promise<Table[]> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getTables error:", error.message);
    return [];
  }
  return (data as Table[]) ?? [];
}

export async function createTable(tableNumber: string): Promise<{
  success: boolean;
  table?: Table;
  error?: string;
}> {
  await requireAuth();
  await requirePro();
  const supabase = createAdminClient();

  const trimmed = tableNumber.trim();
  if (!trimmed) {
    return { success: false, error: "Table number is required" };
  }

  const { data, error } = await supabase
    .from("tables")
    .insert({ table_number: trimmed })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Table number already exists" };
    }
    console.error("createTable error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/tables");
  return { success: true, table: data as Table };
}

export async function deleteTable(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAuth();
  const supabase = createAdminClient();

  const { error } = await supabase.from("tables").delete().eq("id", id);

  if (error) {
    console.error("deleteTable error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/tables");
  return { success: true };
}

export async function validateToken(
  token: string,
): Promise<{ valid: boolean; table_number: string | null }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tables")
    .select("table_number")
    .eq("secure_token", token)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, table_number: null };
  }

  return { valid: true, table_number: data.table_number };
}
