export default function AdminDashboardLoading() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Pulse className="h-8 w-48 mb-2" />
        <Pulse className="h-4 w-32" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      {/* Chart */}
      <Pulse className="h-72 rounded-2xl mb-8" />

      {/* Recent orders table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <Pulse className="h-5 w-32" />
        </div>
        <div className="divide-y divide-slate-700/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <Pulse className="h-4 w-24" />
              <Pulse className="h-4 w-32 flex-1" />
              <Pulse className="h-4 w-16" />
              <Pulse className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-700/60 ${className}`} />;
}
