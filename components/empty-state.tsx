import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, Card } from "@/components/ui";

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <Card className="flex min-h-[220px] flex-col items-start justify-between bg-gradient-to-br from-white to-mist dark:from-slate-950 dark:to-slate-900">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-comet">Empty but temporary</p>
        <h3 className="font-display text-2xl font-bold">{title}</h3>
        <p className="max-w-lg text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      <Link href={ctaHref}>
        <Button className="mt-5">
          {ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}
