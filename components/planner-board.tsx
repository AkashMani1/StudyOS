"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button, Card, SectionHeading, Badge } from "@/components/ui";
import { formatMinutes } from "@/lib/utils";
import { completeSession, generateDailyPlan, missSession, startSession } from "@/services/study-service";
import type { DailyPlanDoc, TaskDoc } from "@/types/domain";

function buildWeekTabs(): string[] {
  const base = new Date();
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return current.toISOString().slice(0, 10);
  });
}

export function PlannerBoard({
  tasks,
  dailyPlans
}: {
  tasks: TaskDoc[];
  dailyPlans: DailyPlanDoc[];
}) {
  const { user } = useAuth();
  const weekTabs = useMemo(() => buildWeekTabs(), []);
  const [selectedDay, setSelectedDay] = useState(weekTabs[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeEndTime, setActiveEndTime] = useState<string | null>(null);
  const [countdownLabel, setCountdownLabel] = useState("00:00:00");
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    if (!activeEndTime) {
      setCountdownLabel("00:00:00");
      return;
    }

    const interval = window.setInterval(() => {
      const target = new Date(`${selectedDay}T${activeEndTime}`);
      const diff = Math.max(target.getTime() - Date.now(), 0);
      const totalSeconds = Math.floor(diff / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      setCountdownLabel(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeEndTime, selectedDay]);

  const plan = dailyPlans.find((entry) => entry.id === selectedDay);
  const blocks = plan?.timeBlocks ?? [];

  const handleStart = async (taskId: string, startTime: string, endTime: string) => {
    if (!user) {
      toast.error("Sign in to start sessions and record your own progress.");
      return;
    }

    await startSession({
      taskId,
      sessionId: `${selectedDay}-${taskId}`,
      plannedDate: selectedDay,
      startTime,
      endTime
    });
    setActiveSessionId(`${selectedDay}-${taskId}`);
    setActiveEndTime(endTime);
    toast.success("Session started. The clock is now against you.");
  };

  const handleComplete = async (taskId: string) => {
    if (!user || !activeSessionId) {
      if (!user) {
        toast.error("Sign in to complete sessions on your own profile.");
      }
      return;
    }

    await completeSession(activeSessionId, taskId);
    setActiveSessionId(null);
    setActiveEndTime(null);
    toast.success("Task completed. Coins processed.");
  };

  const handleMiss = async (taskId: string) => {
    if (!user || !activeSessionId) {
      if (!user) {
        toast.error("Sign in to log misses and keep your real plan updated.");
      }
      return;
    }

    await missSession(activeSessionId, taskId, "Session marked missed from planner");
    setActiveSessionId(null);
    setActiveEndTime(null);
    toast.error("Miss recorded. Rescheduler triggered.");
  };

  const handleGeneratePlan = async () => {
    if (!user) {
      toast.error("Sign in to generate a daily plan from your own tasks.");
      return;
    }

    try {
      setGeneratingPlan(true);
      const result = await generateDailyPlan(selectedDay);
      toast.success(
        result.blockCount > 0
          ? `Generated ${result.blockCount} study block${result.blockCount === 1 ? "" : "s"} for ${result.date}.`
          : `No unfinished tasks were available for ${result.date}.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate a daily plan.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Seven-day planner"
          title="Your AI blocks, one day at a time"
          description="Start, complete, or miss each block directly from the planner. Every action feeds the rescheduler."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {weekTabs.map((day) => (
            <button
              key={day}
              className={`rounded-2xl px-3 py-4 text-left text-sm font-semibold transition ${
                selectedDay === day
                  ? "bg-comet text-white"
                  : "bg-white/70 text-slate-700 hover:bg-white dark:bg-white/10 dark:text-slate-200"
              }`}
              onClick={() => setSelectedDay(day)}
            >
              <p>{new Date(day).toLocaleDateString(undefined, { weekday: "short" })}</p>
              <p className="mt-1 text-xs opacity-80">{day.slice(5)}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-comet">Today&apos;s time blocks</p>
            <h3 className="mt-2 font-display text-2xl font-bold">{selectedDay}</h3>
          </div>
          <div className="flex items-center gap-3">
            <Button disabled={generatingPlan} onClick={() => void handleGeneratePlan()} variant="ghost">
              {generatingPlan ? "Generating..." : "Generate day's plan"}
            </Button>
            <Badge>{activeSessionId ? `Countdown ${countdownLabel}` : `${blocks.length} blocks`}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          {blocks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No AI plan exists for this day yet. Generate one manually from your current unfinished tasks.
            </div>
          ) : (
            blocks.map((block) => {
              const task = tasks.find((entry) => entry.id === block.taskId);
              const active = activeSessionId === `${selectedDay}-${block.taskId}`;

              return (
                <div
                  key={`${selectedDay}-${block.taskId}`}
                  className="rounded-[28px] border border-white/10 bg-white/70 p-5 dark:bg-white/5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <Badge>{task?.subject ?? "Unassigned"}</Badge>
                      <h4 className="font-display text-xl font-bold">{task?.taskName ?? "Missing task reference"}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          {block.startTime} - {block.endTime}
                        </span>
                        <span>{formatMinutes(task?.estimatedMinutes ?? 0)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {!active ? (
                        <Button onClick={() => void handleStart(block.taskId, block.startTime, block.endTime)}>
                          Start session
                        </Button>
                      ) : (
                        <>
                          <Button variant="secondary" onClick={() => void handleComplete(block.taskId)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Complete
                          </Button>
                          <Button variant="danger" onClick={() => void handleMiss(block.taskId)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Miss
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
