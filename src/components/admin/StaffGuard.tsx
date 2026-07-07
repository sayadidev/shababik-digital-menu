"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import type { UserRole } from "@/lib/role-utils";

const STAFF_ALLOWED = ["/admin/orders"];

function isStaffAllowedPath(path: string): boolean {
  if (path === "/admin" || path === "/admin/orders") return true;
  return STAFF_ALLOWED.some((allowed) => path.startsWith(allowed + "/"));
}

export default function StaffGuard({
  role,
  locale,
  children,
}: {
  role: UserRole | null;
  locale: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const restricted = role === "staff" && !isStaffAllowedPath(pathname);

  useEffect(() => {
    if (restricted) {
      router.replace("/admin/orders");
    }
  }, [restricted, router]);

  if (restricted) return null;

  return <>{children}</>;
}
