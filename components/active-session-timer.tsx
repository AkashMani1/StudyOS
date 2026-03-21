"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui";

interface ActiveSessionTimerProps {
  selectedDay: string | null;
  activeEndTime: string | null;
}

export function ActiveSessionTimer({ selectedDay, activeEndTime }: ActiveSessionTimerProps) {
  const [countdownLabel, setCountdownLabel] = useState("00:00:00");

  useEffect(() => {
    if (!activeEndTime || !selectedDay) {
      setCountdownLabel("00:00:00");
      return;
    }

    // Set immediate first tick so we don't wait 1000ms for the first render
    const updateTime = () => {
      const target = new Date(`${selectedDay}T${activeEndTime}`);
      const diff = Math.max(target.getTime() - Date.now(), 0);
      const totalSeconds = Math.floor(diff / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      setCountdownLabel(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(interval);
  }, [activeEndTime, selectedDay]);

  if (!activeEndTime) return null;

  return (
    <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-3 py-1 font-mono text-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]">
      ACTIVE {countdownLabel}
    </Badge>
  );
}
