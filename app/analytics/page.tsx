"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { ProGate } from "@/components/pro-gate";
import { StudyHeatmap } from "@/components/study-heatmap";
import { Button, Card, SectionHeading } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useStudyData } from "@/hooks/use-study-data";
import { getExploreInsights, getExploreSessions } from "@/lib/explore-data";
import { generateWeeklyInsight } from "@/services/study-service";
import type { HourDistributionDatum, StudyHeatCell } from "@/types/domain";

function getStudyMinutesFromSession(session: { plannedStart: string; plannedEnd: string; completed: boolean }): number {
  if (!session.completed) {
    return 0;
  }

  const [, start = "00:00"] = session.plannedStart.split("T");
  const [, end = "00:00"] = session.plannedEnd.split("T");
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { sessions, insights } = useStudyData();
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const visibleSessions = user ? sessions : getExploreSessions();
  const visibleInsights = user ? insights : getExploreInsights();

  const heatmapData = useMemo<StudyHeatCell[]>(() => {
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - index));
      const iso = date.toISOString().slice(0, 10);
      const minutes = visibleSessions
        .filter((session) => session.plannedStart.startsWith(iso))
        .reduce((sum, session) => sum + getStudyMinutesFromSession(session), 0);

      return {
        dayLabel: iso,
        week: Math.floor(index / 7),
        hours: Number((minutes / 60).toFixed(1))
      };
    });
  }, [visibleSessions]);

  const hourDistribution = useMemo<HourDistributionDatum[]>(() => {
    const buckets = new Map<string, HourDistributionDatum>();

    visibleSessions.forEach((session) => {
      const hour = session.plannedStart.split("T")[1]?.slice(0, 2) ?? "00";
      const bucket = buckets.get(hour) ?? { hour: `${hour}:00`, minutes: 0, misses: 0 };
      bucket.minutes += getStudyMinutesFromSession(session);
      bucket.misses += session.completed ? 0 : 1;
      buckets.set(hour, bucket);
    });

    return Array.from(buckets.values()).sort((left, right) => left.hour.localeCompare(right.hour));
  }, [visibleSessions]);

  const focusScore = useMemo(() => {
    const planned = visibleSessions.length;
    const completed = visibleSessions.filter((session) => session.completed).length;
    return planned === 0 ? 0 : Math.round((completed / planned) * 100);
  }, [visibleSessions]);

  const worstSlots = [...hourDistribution]
    .sort((left, right) => right.misses - left.misses)
    .slice(0, 3);

  const latestInsight = visibleInsights[0];

  const handleGenerateInsight = async () => {
    if (!user) {
      toast.error("Sign in to generate your weekly insight.");
      return;
    }

    try {
      setGeneratingInsight(true);
      await generateWeeklyInsight();
      toast.success("Weekly insight generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate weekly insight.");
    } finally {
      setGeneratingInsight(false);
    }
  };

  return (
    <AppShell
      title="Analytics"
      subtitle="The premium dashboard for study density, focus timing, failure patterns, and your weekly AI report card."
    >
      <ProGate>
        <div className="grid gap-6">
          <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <Card className="space-y-4">
              <SectionHeading
                eyebrow="Heatmap"
                title="Four weeks of visible density"
                description="Seven columns, four rows, one honest picture of your study consistency."
              />
              <StudyHeatmap data={heatmapData} />
            </Card>
            <Card className="space-y-4">
              <SectionHeading
                eyebrow="Focus score"
                title={`${focusScore}%`}
                description="Completed sessions divided by planned sessions, recalculated client-side from Firestore."
              />
              <div className="flex items-center gap-3 rounded-3xl bg-white/70 px-4 py-5 dark:bg-white/5">
                {focusScore >= 70 ? <ArrowUpRight className="h-5 w-5 text-aurora" /> : <ArrowDownRight className="h-5 w-5 text-ember" />}
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {focusScore >= 70 ? "You are holding your line more often than not." : "Your plan is still winning on paper only."}
                </p>
              </div>
              <div className="rounded-3xl bg-white/70 p-4 dark:bg-white/5">
                <p className="text-sm font-semibold">Worst failure slots</p>
                <div className="mt-3 space-y-2">
                  {worstSlots.map((slot) => (
                    <div key={slot.hour} className="flex items-center justify-between text-sm">
                      <span>{slot.hour}</span>
                      <span>{slot.misses} misses</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <Card className="space-y-4">
              <SectionHeading
                eyebrow="Best study time"
                title="When the work actually lands"
                description="Minutes completed by hour of day."
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourDistribution}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#8ee3c1" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <SectionHeading
                eyebrow="Weekly AI report"
                title="Report card"
                description="Generate your latest review on demand and read it here."
              />
              <div className="flex justify-end">
                <Button disabled={generatingInsight} onClick={() => void handleGenerateInsight()} variant="ghost">
                  {generatingInsight ? "Generating..." : "Generate weekly insight"}
                </Button>
              </div>
              <div className="rounded-3xl bg-slate-950 p-5 text-sm text-white dark:bg-white/10">
                <p className="whitespace-pre-wrap">
                  {latestInsight?.report ??
                    "No weekly insight generated yet. Use the button above to create one from your recent sessions."}
                </p>
              </div>
            </Card>
          </section>
        </div>
      </ProGate>
    </AppShell>
  );
}
