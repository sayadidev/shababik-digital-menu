"use client";

import { useEffect, useRef, useState } from "react";

type Metric = {
  label: string;
  value: number;
  sub: string;
  subColor?: string;
};

export default function DashboardMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-5">
      {metrics.map((m) => (
        <KpiCard key={m.label} {...m} />
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, subColor = "text-muted" }: Metric) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1200;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * value);
            setDisplay(current);
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25),0_4px_12px_rgba(212,196,176,0.12)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(184,122,74,0.15)]">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p ref={ref} className="text-2xl md:text-3xl font-bold text-foreground">
        {display.toLocaleString()}
      </p>
      <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}
