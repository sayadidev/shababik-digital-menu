export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5 animate-pulse">
      {/* KPI skeletons */}
      <div className="grid grid-cols-3 gap-3 md:gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface rounded-xl p-4 md:p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
            <div className="h-3 w-20 bg-muted/30 rounded-full mb-3" />
            <div className="h-7 w-16 bg-muted/30 rounded-lg mb-2" />
            <div className="h-3 w-28 bg-muted/20 rounded-full" />
          </div>
        ))}
      </div>

      {/* Sparkline skeleton */}
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <div className="h-3 w-36 bg-muted/30 rounded-full mb-4" />
        <div className="flex items-end gap-2 h-32">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-muted/20 rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
              <div className="h-2 w-6 bg-muted/20 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Trending + Quick actions skeletons */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <div className="h-3 w-24 bg-muted/30 rounded-full mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 rounded-full bg-muted/20 shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-muted/30 rounded-full mb-1" />
                <div className="h-2 w-16 bg-muted/20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
          <div className="h-3 w-24 bg-muted/30 rounded-full mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 space-y-2">
                <div className="h-5 w-5 bg-muted/20 rounded" />
                <div className="h-3 w-16 bg-muted/30 rounded-full" />
                <div className="h-2 w-20 bg-muted/20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent items skeleton */}
      <div className="bg-surface rounded-xl p-5 shadow-[0_1px_3px_rgba(212,196,176,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 bg-muted/30 rounded-full" />
          <div className="h-3 w-16 bg-muted/20 rounded-full" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[140px] bg-surface rounded-xl p-3 border border-border/50 space-y-2 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-muted/20 mx-auto" />
              <div className="h-3 w-20 bg-muted/30 rounded-full mx-auto" />
              <div className="h-2 w-12 bg-muted/20 rounded-full mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
