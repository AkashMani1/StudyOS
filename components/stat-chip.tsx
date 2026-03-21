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
      ? "text-emerald-400"
      : trend === "down"
        ? "text-rose-400"
        : "text-slate-300";

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 ${className}`}
    >
      <div className="rounded-xl bg-white/15 p-2">
        <Icon className={`h-4 w-4 ${trendColor}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-widest opacity-60">{label}</p>
        <p className="font-display text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
