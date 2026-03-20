"use client";

import type { LucideIcon } from "lucide-react";

interface StatChipProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatChip({ icon: Icon, label, value, trend, className = "" }: StatChipProps) {
  const trendColor =
    trend === "up"
      ? "text-aurora"
      : trend === "down"
        ? "text-ember"
        : "text-slate-400 dark:text-slate-500";

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm ${className}`}
    >
      <div className="rounded-xl bg-white/10 p-2">
        <Icon className={`h-4 w-4 ${trendColor}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-widest opacity-60">{label}</p>
        <p className="font-display text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
