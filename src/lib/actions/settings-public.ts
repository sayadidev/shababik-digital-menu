"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Currency } from "@/types/database";

export type OrderingSettings = {
  tier: "basic" | "pro";
  ordering_enabled: boolean;
  enable_usd: boolean;
  active_currency: Currency;
};

export async function getOrderingSettings(): Promise<OrderingSettings> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("tier, ordering_enabled, enable_usd, active_currency")
    .eq("id", 1)
    .single();

  if (error)
    return {
      tier: "basic",
      ordering_enabled: false,
      enable_usd: true,
      active_currency: "TRY",
    };

  return {
    tier: data.tier as "basic" | "pro",
    ordering_enabled: data.ordering_enabled,
    enable_usd: data.enable_usd ?? true,
    active_currency: data.active_currency ?? "TRY",
  };
}
