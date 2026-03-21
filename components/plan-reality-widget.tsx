"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, SectionHeading } from "@/components/ui";
import { formatMinutes } from "@/lib/utils";
import type { DailyPlanDoc, SessionDoc, SubjectCompletionDatum, TaskDoc } from "@/types/domain";

function computePlannedMinutes(day: string, tasks: TaskDoc[]): number {
  return tasks
    .filter((task) => task.suggestedDay === day)
    .reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0);
}

function computeActualMinutes(day: string, sessions: SessionDoc[]): number {
  return sessions
    .filter((session) => session.plannedStart.startsWith(day) && session.completed)
    .reduce((sum, session) => {
      const [, start = "00:00"] = session.plannedStart.split("T");
      const [, end = "00:00"] = session.plannedEnd.split("T");
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
      return sum + Math.max(minutes, 0);
    }, 0);
}

export function PlanRealityWidget({
  tasks,
  sessions
}: {
  tasks: TaskDoc[];
  sessions: SessionDoc[];
}) {
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const target = new Date();
      target.setDate(target.getDate() - (6 - index));
      return target.toISOString().slice(0, 10);
    });

    return days.map((day) => ({
      day: day.slice(5),
      plannedHours: Number((computePlannedMinutes(day, tasks) / 60).toFixed(1)),
      actualHours: Number((computeActualMinutes(day, sessions) / 60).toFixed(1))
    }));
  }, [sessions, tasks]);

  const subjectData = useMemo<SubjectCompletionDatum[]>(
    () =>
      Array.from(
        tasks.reduce((map, task) => {
          const current = map.get(task.subject) ?? { subject: task.subject, completed: 0, total: 0 };
          current.total += 1;
          current.completed += task.completed ? 1 : 0;
          map.set(task.subject, current);
          return map;
        }, new Map<string, SubjectCompletionDatum>())
      ).map(([, value]) => value),
    [tasks]
  );

  const missedSessions = sessions.filter((session) => !session.completed).slice(0, 4);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Plan vs reality"
          title="What you promised vs what you actually did"
          description="Seven-day comparison built from your AI plan and recorded sessions."
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="plannedHours" fill="#6366f1" radius={[10, 10, 0, 0]} />
              <Bar dataKey="actualHours" fill="#34d399" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card className="space-y-4">
          <SectionHeading
            eyebrow="Completion split"
            title="Subject accuracy"
            description="Your strongest and weakest subjects are visible immediately."
          />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData.map((item) => ({
                    name: item.subject,
                    value: item.total === 0 ? 0 : Math.round((item.completed / item.total) * 100)
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  fill="#f43f5e"
                />
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="space-y-4">
          <SectionHeading
            eyebrow="Missed sessions"
            title="Failures need to stay visible"
            description="These are the blocks that slipped recently."
          />
          <div className="space-y-3">
            {missedSessions.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No misses in recent history. Keep it that way.</p>
            ) : (
              missedSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/5 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{session.missedReason ?? "Unlabeled miss"}</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatMinutes(45)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{session.plannedStart}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
