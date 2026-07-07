type OrderedItem = {
  item_name: string;
  order_count: number;
};

export default function TrendingItems({ items, locale }: { items: OrderedItem[]; locale: string }) {
  if (items.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
        <h3 className="text-sm font-semibold text-foreground mb-4">{locale === "ar" ? "الأكثر طلباً" : "Top Requested"}</h3>
        <p className="text-sm text-muted text-center py-6">{locale === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
      <h3 className="text-sm font-semibold text-foreground mb-4">{locale === "ar" ? "الأكثر طلباً" : "Top Requested"}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.item_name} className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                i === 0
                  ? "bg-primary text-white"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.item_name}</p>
              <p className="text-xs text-muted">{item.order_count.toLocaleString()} {locale === "ar" ? "طلب" : "orders"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
