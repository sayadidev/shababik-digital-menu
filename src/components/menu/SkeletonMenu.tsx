export default function SkeletonMenu() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-28 rounded-md bg-brand-light/60" />
        <div className="h-8 w-20 rounded-full bg-brand-light/40" />
      </div>

      {/* Category pills skeleton */}
      <div className="mb-8 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-24 shrink-0 rounded-full bg-brand-light/50"
          />
        ))}
      </div>

      {/* Category sections */}
      {[1, 2].map((s) => (
        <div key={s} className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-5 w-28 rounded bg-brand-light/60" />
            <span className="h-px flex-1 bg-border" />
          </div>
          {[1, 2].map((c) => (
            <div
              key={c}
              className="mb-3.5 flex gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="mt-1 h-[88px] w-[88px] shrink-0 rounded-xl bg-brand-light/40 sm:h-24 sm:w-24" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-brand-light/50" />
                <div className="h-3 w-full rounded bg-brand-light/30" />
                <div className="h-3 w-2/3 rounded bg-brand-light/30" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-24 rounded-md border border-border bg-brand-light/30" />
                  <div className="h-6 w-24 rounded-md border border-border bg-brand-light/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
