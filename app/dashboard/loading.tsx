import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-8 w-64 rounded-xl" />
      </div>

      {/* Top cards row */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 w-full rounded-[28px]" />
        <Skeleton className="h-48 w-full rounded-[28px]" />
        <Skeleton className="h-48 w-full rounded-[28px]" />
      </div>

      {/* Wallet & subscription row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-[28px]" />
        <Skeleton className="h-64 w-full rounded-[28px]" />
      </div>
    </div>
  );
}
