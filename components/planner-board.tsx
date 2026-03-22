"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Play, XCircle, Plus, Coins, AlertCircle, History, ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button, SectionHeading } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { formatMinutes, cn } from "@/lib/utils";
import { completeSession, missSession, startSession, rescheduleTask } from "@/services/study-service";
import { ActiveSessionTimer } from "@/components/active-session-timer";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import type { TaskDoc } from "@/types/domain";

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface WeekDay {
  iso: string;
  weekday: string;
  dayNum: number;
}

function buildWeekTabs(): WeekDay[] {
  const base = new Date();
  const day = base.getDay();
  // Always show Mon-Sun of current week
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return {
      iso: current.toISOString().slice(0, 10),
      weekday: SHORT_DAYS[current.getDay()]!,
      dayNum: current.getDate()
    };
  });
}

export function PlannerBoard({ tasks }: { tasks: TaskDoc[] }) {
  const { user, profile } = useAuth();
  const weekTabs = useMemo(() => buildWeekTabs(), []);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Persisted Session State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeEndTime, setActiveEndTime] = useState<string | null>(null);
  
  // Optimistic UI State
  const [optimisticallyRemoved, setOptimisticallyRemoved] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Initial mount: Calculate today and hydrate localStorage
  useEffect(() => {
    setMounted(true);
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    setSelectedDay(weekTabs[todayIndex]?.iso ?? weekTabs[0]?.iso ?? null);

    const savedSession = localStorage.getItem("planner_activeSessionId");
    const savedEndTime = localStorage.getItem("planner_activeEndTime");
    if (savedSession) setActiveSessionId(savedSession);
    if (savedEndTime) setActiveEndTime(savedEndTime);
  }, [weekTabs]);

  // Sync to localStorage
  useEffect(() => {
    if (mounted) {
      if (activeSessionId) localStorage.setItem("planner_activeSessionId", activeSessionId);
      else localStorage.removeItem("planner_activeSessionId");
      
      if (activeEndTime) localStorage.setItem("planner_activeEndTime", activeEndTime);
      else localStorage.removeItem("planner_activeEndTime");
    }
  }, [activeSessionId, activeEndTime, mounted]);

  // Sync with Cloud Profile
  useEffect(() => {
    if (profile?.sessionActive) {
      setActiveSessionId(profile.currentSessionId || null);
      setActiveEndTime(profile.sessionEndTime || null);
    } else if (mounted && !profile?.sessionActive && activeSessionId) {
      // If cloud says inactive but local says active, clear local
      setActiveSessionId(null);
      setActiveEndTime(null);
    }
  }, [profile?.sessionActive, profile?.currentSessionId, profile?.sessionEndTime, mounted]);

  const isToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return selectedDay === today;
  }, [selectedDay]);

  const isPast = useMemo(() => {
    if (!selectedDay) return false;
    const today = new Date().toISOString().slice(0, 10);
    return selectedDay < today;
  }, [selectedDay]);

  const [reschedulingTaskId, setReschedulingTaskId] = useState<string | null>(null);

  const handleReschedule = async (taskId: string) => {
    if (!user) {
      toast.error("Sign in to move tasks.");
      return;
    }

    try {
      setReschedulingTaskId(taskId);
      const today = new Date().toISOString().slice(0, 10);
      await rescheduleTask(taskId, today);
      
      // Automatic tab switch to Today
      setSelectedDay(today);
      
      setOptimisticallyRemoved((prev) => [...prev, taskId]);
      toast.success("Task moved to Today!");
    } catch (error) {
      toast.error("Failed to reschedule task.");
    } finally {
      setReschedulingTaskId(null);
    }
  };

  // Derive execution blocks directly from User's manual tasks
  const dailyTasks = useMemo(() => {
    return tasks
      .filter((t) => t.suggestedDay === selectedDay && !t.completed && !optimisticallyRemoved.includes(t.id))
      .sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [tasks, selectedDay, optimisticallyRemoved]);

  const handleStart = async (task: TaskDoc) => {
    if (!user) {
      toast.error("Sign in to start sessions and record your own progress.");
      return;
    }

    const sessionId = `${selectedDay ?? ""}-${task.id}`;
    
    // Dynamically generate timestamps based on the exact moment the user hits START
    const now = new Date();
    const end = new Date(now.getTime() + task.estimatedMinutes * 60000);
    
    const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
    
    // Optimistic immediate update
    setActiveSessionId(sessionId);
    setActiveEndTime(endTime);
    toast.success("Session started. Time to execute.");

    try {
      await startSession({
        taskId: task.id,
        sessionId,
        plannedDate: selectedDay ?? "",
        startTime,
        endTime
      });
    } catch (err) {
      toast.error("Failed to sync session start to server.");
    }
  };

  const handleComplete = async (taskId: string) => {
    if (!user || !activeSessionId) return;

    // Optimistic removal
    setOptimisticallyRemoved(prev => [...prev, taskId]);
    const cachedSessionId = activeSessionId;
    setActiveSessionId(null);
    setActiveEndTime(null);
    toast.success("🎉 Task complete! Focus engine updated.");

    try {
      await completeSession(cachedSessionId, taskId);
    } catch (err) {
      toast.error("Sync failed. Refresh to ensure your data saved.");
    }
  };

  const handleMiss = async (taskId: string) => {
    if (!user || !activeSessionId) return;

    // High-Stakes Abort: Remove task from today's timeline and apply penalty
    setOptimisticallyRemoved(prev => [...prev, taskId]);
    const cachedSessionId = activeSessionId;
    setActiveSessionId(null);
    setActiveEndTime(null);
    toast.error("💀 Focus forfeited. -10 Coins deducted.");

    try {
      await missSession(cachedSessionId, taskId, "Manual session aborted by user");
    } catch (err) {
      toast.error("Sync failed. Penalty might not have registered.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <CreateTaskDialog 
        isOpen={isTaskDialogOpen} 
        onClose={() => setIsTaskDialogOpen(false)} 
        onSuccess={() => {
          // No reload needed! Firebase onSnapshot handles real-time updates.
          setIsTaskDialogOpen(false);
        }} 
        defaultDate={selectedDay || undefined}
      />

      <SectionHeading
        eyebrow="Seven-day horizon"
        title="Your execution timeline"
        description="Select a day, manually assign your targets, and start the timer. The system will handle the streaks and coins."
      />

      {/* Sleek Week Tabs */}
      <div className="grid grid-cols-7 gap-2">
        {weekTabs.map((day) => {
          const isSelected = selectedDay === day.iso;
          return (
            <button
              key={day.iso}
              onClick={() => setSelectedDay(day.iso)}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl py-3 transition-all duration-300 relative overflow-hidden",
                isSelected 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105" 
                  : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{day.weekday}</span>
              <span className={cn("text-lg font-black mt-1", isSelected ? "text-white" : "")}>{day.dayNum}</span>
              {isSelected && <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-[32px] border border-white/5 bg-[#050505]/50 backdrop-blur-xl p-8 shadow-2xl">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-slate-400">
                {isPast ? <History className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
              </div>
              <h3 className="font-display text-3xl font-black text-white capitalize">
                {isToday ? "Today's Agenda" : isPast ? "Historical Record" : "Future Strategy"}
              </h3>
              {activeSessionId && <ActiveSessionTimer selectedDay={selectedDay || ""} activeEndTime={activeEndTime} />}
            </div>
            <p className="mt-2 text-indigo-400 font-medium text-sm flex items-center gap-2">
              {dailyTasks.length === 0 ? "No tasks targeted." : `${dailyTasks.length} active target${dailyTasks.length === 1 ? "" : "s"} locked in.`}
              {isPast && dailyTasks.length > 0 && <span className="text-rose-400 opacity-60">• Contains Overdue items</span>}
            </p>
          </div>
          {!isPast && (
            <div className="flex items-center">
               <Button 
                onClick={() => setIsTaskDialogOpen(true)} 
                className="rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] sm:px-5"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            </div>
          )}
        </div>

        {/* Vertical Execution Board */}
        {dailyTasks.length === 0 ? (
          <EmptyState
            title={isToday ? "Nothing planned for today" : isPast ? "No historical records" : "Planning ahead?"}
            description={isPast ? "Your execution history for this day is empty." : "Manually add targets to build your focus schedule."}
            ctaLabel={!isPast ? "Add Target" : undefined}
            ctaAction={!isPast ? (() => setIsTaskDialogOpen(true)) : undefined}
          />
        ) : (
          <div className="relative pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-gradient-to-b before:from-indigo-500/50 before:via-white/5 before:to-transparent space-y-8">
            {dailyTasks.map((task) => {
              const isThisBlockActive = activeSessionId === `${selectedDay}-${task.id}`;
              const isAnyBlockActive = activeSessionId !== null;

              return (
                <div key={task.id} className="relative group animate-in slide-in-from-left-4 duration-300">
                  {/* Timeline Node */}
                  <div className={cn(
                    "absolute -left-[35px] top-6 h-3 w-3 rounded-full border-2 transition-all duration-300",
                    isThisBlockActive 
                      ? "bg-indigo-500 border-indigo-200 ring-4 ring-indigo-500/30 scale-125" 
                      : "bg-[#050505] border-white/20 group-hover:border-indigo-400 group-hover:bg-indigo-400/20"
                  )} />
                  
                  {/* Task Card */}
                  <div className={cn(
                    "rounded-[24px] border p-6 transition-all duration-300",
                    isThisBlockActive
                      ? "bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)] translate-x-1"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                  )}>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      
                      {/* Left: Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/70">
                            {task.subject}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full ring-1 ring-amber-400/20">
                            <Coins className="h-3 w-3" />
                            20 Coins
                          </span>
                          {(task.startTime || task.endTime) && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full ring-1 ring-indigo-400/20">
                              <CalendarDays className="h-3 w-3" />
                              {task.startTime || "??"} - {task.endTime || "??"}
                            </span>
                          )}
                           <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                            <Clock3 className="h-3 w-3" />
                            {formatMinutes(task.estimatedMinutes)} Target
                          </span>
                          {isPast && !task.completed && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              <AlertCircle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <h4 className={cn(
                          "font-display text-2xl font-bold leading-tight",
                          isToday ? "text-white" : isPast ? "text-white/20" : "text-white/40"
                        )}>
                          {task.taskName}
                        </h4>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 mt-2 lg:mt-0">
                        {isPast ? (
                          <Button 
                            disabled={reschedulingTaskId === task.id}
                            onClick={() => void handleReschedule(task.id)}
                            className="rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all group"
                          >
                            {reschedulingTaskId === task.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowRight className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            )}
                            {reschedulingTaskId === task.id ? "Moving..." : "Move to Today"}
                          </Button>
                        ) : !isToday ? (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                            Planned for {selectedDay}
                          </div>
                        ) : !isThisBlockActive ? (
                          <Button 
                            disabled={isAnyBlockActive} 
                            onClick={() => void handleStart(task)}
                            className={cn(
                              "rounded-full transition-all",
                              isAnyBlockActive ? "opacity-50" : "hover:scale-105"
                            )}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Focus
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              onClick={() => void handleMiss(task.id)}
                              className="rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Abort Focus
                            </Button>
                            <Button 
                              onClick={() => void handleComplete(task.id)}
                              className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-all"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Complete
                            </Button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
