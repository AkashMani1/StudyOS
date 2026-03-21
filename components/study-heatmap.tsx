"use client";

import { chunkIntoWeeks } from "@/lib/utils";
import type { StudyHeatCell } from "@/types/domain";

function colorForHours(hours: number): string {
  if (hours <= 0) return "rgba(148, 163, 184, 0.18)";
  if (hours < 1) return "rgba(99, 102, 241, 0.32)"; // indigo-500 light
  if (hours < 2) return "rgba(99, 102, 241, 0.6)";  // indigo-500 medium
  if (hours < 3) return "rgba(52, 211, 153, 0.62)"; // emerald-400
  return "rgba(244, 63, 94, 0.78)";                 // rose-500
}

export function StudyHeatmap({ data }: { data: StudyHeatCell[] }) {
  const weeks = chunkIntoWeeks(data, 7);
  const cellSize = 28;

  return (
    <svg
      viewBox={`0 0 ${weeks.length * (cellSize + 8)} ${7 * (cellSize + 8)}`}
      className="h-[260px] w-full overflow-visible"
      role="img"
      aria-label="Weekly study heatmap"
    >
      {weeks.map((week, weekIndex) =>
        week.map((cell, dayIndex) => (
          <g key={`${cell.dayLabel}-${weekIndex}`}>
            <rect
              x={weekIndex * (cellSize + 8)}
              y={dayIndex * (cellSize + 8)}
              width={cellSize}
              height={cellSize}
              rx={6}
              fill={colorForHours(cell.hours)}
            />
            <title>{`${cell.dayLabel}: ${cell.hours.toFixed(1)} hours`}</title>
          </g>
        ))
      )}
    </svg>
  );
}
