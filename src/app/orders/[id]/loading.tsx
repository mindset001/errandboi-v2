import { Skeleton } from "@/components/ui/Skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      {/* Back link */}
      <Skeleton className="h-4 w-28 mb-6" />

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-1 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1">
              <Skeleton className="h-2.5 w-2.5 rounded-full flex-shrink-0" />
              {i < 3 && <Skeleton className="h-0.5 flex-1 mx-0.5" />}
            </div>
          ))}
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-4">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>

      {/* Driver card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-4">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-10 w-20 rounded-xl flex-shrink-0" />
        </div>
      </div>

      {/* Payment card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        <Skeleton className="h-5 w-20 mb-4" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  );
}
