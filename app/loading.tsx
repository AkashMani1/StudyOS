import { Skeleton } from "@/components/ui";

export default function RootLoading() {
  return (
    <main className="min-h-screen bg-hero-grid px-4 py-8 dark:bg-night">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-24 w-full rounded-[32px]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-[32px]" />
          <Skeleton className="h-64 w-full rounded-[32px]" />
          <Skeleton className="h-64 w-full rounded-[32px]" />
        </div>
      </div>
    </main>
  );
}
