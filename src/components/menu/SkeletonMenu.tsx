export default function SkeletonMenu() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-7 menu-page-bg">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-28 rounded-md bg-brand-light/60 skeleton" />
        <div className="h-8 w-20 rounded-full bg-brand-light/40 skeleton" />
      </div>

      <div className="mb-8 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-24 shrink-0 rounded-full bg-brand-light/50 skeleton"
          />
        ))}
      </div>

      {[1, 2].map((s) => (
        <div key={s} className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-5 w-28 rounded bg-brand-light/60 skeleton" />
            <span className="h-px flex-1 bg-border" />
          </div>
          {[1, 2].map((c) => (
            <div
              key={c}
              className="card card-border border-border bg-surface mb-3.5"
            >
              <div className="card-body flex-row gap-4 p-4">
                <div className="mt-1 h-[88px] w-[88px] shrink-0 rounded-xl bg-brand-light/40 skeleton sm:h-24 sm:w-24" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-brand-light/50 skeleton" />
                  <div className="h-3 w-full rounded bg-brand-light/30 skeleton" />
                  <div className="h-3 w-2/3 rounded bg-brand-light/30 skeleton" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-6 w-24 rounded-md border border-border bg-brand-light/30 skeleton" />
                    <div className="h-6 w-24 rounded-md border border-border bg-brand-light/30 skeleton" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
