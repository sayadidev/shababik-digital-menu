/**
 * Fix admin user roles — assign super_admin to users missing the role in app_metadata.
 *
 * Usage:
 *   npx tsx scripts/fix-admin-role.ts [email]
 *
 * If email is provided, only that user is updated.
 * Otherwise, ALL users without a role get super_admin assigned.
 */

import { config } from "dotenv";
config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });
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

const targetEmail = process.argv[2];

async function main() {
  console.log("🔐 Listing users...\n");

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }

  let fixed = 0;

  for (const user of data.users) {
    const role = user.app_metadata?.role;
    if (role) continue;

    if (targetEmail && user.email !== targetEmail) continue;

    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { role: "super_admin" },
    });

    if (updateErr) {
      console.error(`  ✗ ${user.email}: ${updateErr.message}`);
    } else {
      console.log(`  ✓ ${user.email} → super_admin`);
      fixed++;
    }
  }

  if (fixed === 0) {
    console.log("\n✅ All users already have roles assigned.");
  } else {
    console.log(`\n✅ Fixed ${fixed} user(s).`);
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
