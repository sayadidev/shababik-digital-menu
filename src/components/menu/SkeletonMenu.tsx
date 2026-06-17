/**
 * Loading skeleton placeholders for the customer menu.
 * Matches the real layout shape for a smooth loading experience.
 */
export default function SkeletonMenu() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-2 h-8 w-44 rounded bg-amber-200" />
        <div className="mx-auto h-4 w-56 rounded bg-gray-200" />
      </div>

      {/* Category pills skeleton */}
      <div className="mb-8 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 shrink-0 rounded-full bg-gray-200" />
        ))}
      </div>

      {/* Category sections */}
      {[1, 2].map((s) => (
        <div key={s} className="mb-10">
          <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
          {[1, 2, 3].map((c) => (
            <div
              key={c}
              className="mb-4 flex gap-4 rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
                <div className="flex gap-3 pt-1">
                  <div className="h-4 w-20 rounded bg-amber-100" />
                  <div className="h-4 w-20 rounded bg-amber-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
