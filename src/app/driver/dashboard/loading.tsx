export default function DriverDashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-4 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-slate-800 rounded-2xl" />
          <div className="h-12 bg-slate-800 rounded-xl" />
          <div className="h-12 bg-slate-800 rounded-xl" />
          <div className="h-32 bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
