type Props = {
  data: { label: string; value: number }[];
  totalLabel?: string;
  locale?: string;
};

export default function SparklineChart({ data, totalLabel, locale = "en" }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-surface rounded-xl p-5 md:p-6 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{locale === "ar" ? "اتجاه المشاهدات (7 أيام)" : "Views Trend (7 days)"}</h3>
        {totalLabel && (
          <span className="text-xs text-success font-medium">{totalLabel}</span>
        )}
      </div>
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-primary/60 hover:bg-primary transition-all duration-300 cursor-pointer relative group"
            style={{ height: `${(d.value / max) * 100}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {d.value.toLocaleString(locale === "ar" ? "ar" : "en")} {locale === "ar" ? "مشاهدة" : "views"}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted mt-2">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
