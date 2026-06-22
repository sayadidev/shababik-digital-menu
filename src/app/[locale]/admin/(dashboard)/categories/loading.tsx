export default function CategoriesLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-muted/30 rounded-lg" />
        <div className="h-9 w-32 bg-muted/20 rounded-xl" />
      </div>

      <div className="bg-surface rounded-xl shadow-[0_1px_3px_rgba(212,196,176,0.25)] overflow-hidden">
        {/* Desktop table skeleton */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-5 py-3">
                    <div className="h-3 w-16 bg-muted/20 rounded-full" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((row) => (
                <tr key={row} className="border-b border-border/50">
                  {[1, 2, 3, 4, 5].map((col) => (
                    <td key={col} className="px-5 py-3.5">
                      <div className="h-3 bg-muted/20 rounded-full" style={{ width: `${Math.random() * 40 + 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards skeleton */}
        <div className="md:hidden divide-y divide-border/50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-muted/30 rounded-full" />
                <div className="h-4 w-10 bg-muted/20 rounded-full" />
              </div>
              <div className="h-3 w-40 bg-muted/20 rounded-full" />
              <div className="flex gap-2">
                <div className="h-7 w-7 bg-muted/20 rounded-lg" />
                <div className="h-7 w-7 bg-muted/20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
