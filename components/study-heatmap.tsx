"use client";

import { chunkIntoWeeks } from "@/lib/utils";
import type { StudyHeatCell } from "@/types/domain";

function colorForHours(hours: number): string {
  if (hours <= 0) return "rgba(148, 163, 184, 0.18)";
  if (hours < 1) return "rgba(95, 111, 255, 0.32)";
  if (hours < 2) return "rgba(95, 111, 255, 0.5)";
  if (hours < 3) return "rgba(142, 227, 193, 0.62)";
  return "rgba(255, 123, 84, 0.78)";
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
              rx={10}
              fill={colorForHours(cell.hours)}
            />
            <title>{`${cell.dayLabel}: ${cell.hours.toFixed(1)} hours`}</title>
          </g>
        ))
      )}
    </svg>
  );
}
