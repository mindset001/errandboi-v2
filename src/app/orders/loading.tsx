import { Skeleton } from "@/components/ui/Skeleton";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <Skeleton className="h-8 w-36 mb-8" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
