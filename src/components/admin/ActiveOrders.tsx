import { createAdminClient } from "@/lib/supabase/admin";
import { Link } from "@/i18n/navigation";

async function getActiveOrders() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id, table_number, status, created_at")
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(4);
  return data ?? [];
}

function formatTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

const statusColor: Record<string, string> = {
  pending: "#d4a017",
  processing: "#9a6a3a",
};

export default async function ActiveOrders({ locale }: { locale: string }) {
  const orders = await getActiveOrders().catch(() => []);

  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">
          {locale === "ar" ? "الطلبات النشطة" : "Active Orders"}
        </h3>
        <Link href="/admin/orders" locale={locale} className="text-xs text-primary font-medium hover:underline">
          {locale === "ar" ? "عرض الكل →" : "View All →"}
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center">
          {locale === "ar" ? "لا توجد طلبات نشطة حالياً" : "No active orders right now"}
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "#f5efdf" }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono font-bold shrink-0" style={{ color: "#3B2818" }}>#{order.id.slice(0, 8)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                  style={{ backgroundColor: `${statusColor[order.status] ?? "#8a7a6a"}18`, color: statusColor[order.status] ?? "#8a7a6a" }}>
                  {locale === "ar"
                    ? (order.status === "pending" ? "انتظار" : "تحضير")
                    : (order.status === "pending" ? "Pending" : "Preparing")}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs" style={{ color: "#8a7a6a" }}>
                  {locale === "ar" ? `طاولة ${order.table_number}` : `Table ${order.table_number}`}
                </span>
                <span className="text-[11px]" style={{ color: "#8a7a6a" }}>{formatTime(order.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
