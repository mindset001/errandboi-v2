export default function AdminDriversLoading() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Pulse className="h-8 w-28 mb-2" />
        <Pulse className="h-4 w-56" />
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Pulse key={i} className="h-4 w-14" />
          ))}
        </div>
        <div className="divide-y divide-slate-700/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-6">
              <div>
                <Pulse className="h-4 w-28 mb-1" />
                <Pulse className="h-3 w-24" />
              </div>
              <Pulse className="h-4 w-16" />
              <Pulse className="h-4 w-20" />
              <Pulse className="h-4 w-8" />
              <Pulse className="h-6 w-16 rounded-full" />
              <Pulse className="h-8 w-32 rounded-lg flex-1" />
              <Pulse className="h-8 w-20 rounded-lg" />
              <Pulse className="h-8 w-8 rounded-lg" />
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
