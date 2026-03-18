"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavItems, secondaryNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

const tabItems = [...primaryNavItems, ...secondaryNavItems.filter((item) => item.href !== "/admin")];

export function SectionTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2 rounded-[24px] border border-white/20 bg-white/70 p-2 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        {tabItems.map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-comet text-white"
                  : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
