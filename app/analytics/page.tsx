"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
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
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Deep Insights</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">The premium dashboard for study density, focus timing, failure patterns, and your weekly AI report card.</p>
      </header>
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
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 dark:border-white/5 dark:bg-slate-800/50">
                {focusScore >= 70 ? <ArrowUpRight className="h-5 w-5 text-emerald-500" /> : <ArrowDownRight className="h-5 w-5 text-rose-500" />}
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {focusScore >= 70 ? "You are holding your line more often than not." : "Your plan is still winning on paper only."}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Worst failure slots</p>
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
                    <Bar dataKey="minutes" fill="#34d399" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  eyebrow="Deep Insight"
                  title="AI Report Card"
                  description="A brutal, contextual analysis of your study timeline."
                />
                <Button disabled={generatingInsight} onClick={() => void handleGenerateInsight()} variant="secondary" className="text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 whitespace-nowrap">
                  {generatingInsight ? "Analyzing Log..." : "Run Analysis"}
                </Button>
              </div>
              
              {latestInsight?.reportCard ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
                  {/* Grade Header */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-black text-white shadow-xl ring-1 ring-white/20">
                      {latestInsight.reportCard.grade}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg lg:text-xl">Execution Grade</h4>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-relaxed">{latestInsight.reportCard.summary}</p>
                    </div>
                  </div>

                  {/* Specific Feedback */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5">
                      <p className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2 tracking-wider">Focus Execution</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{latestInsight.focusScoreFeedback}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5">
                      <p className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 mb-2 tracking-wider">Time Patterns</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{latestInsight.bestStudyTimeFeedback}</p>
                    </div>
                  </div>

                  {/* Deep Insights */}
                  {latestInsight.deepInsights?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Synthesized Insights</p>
                      {latestInsight.deepInsights.map((insight, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Items */}
                  {latestInsight.actionItems?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Actionable Next Steps</p>
                      {latestInsight.actionItems.map((item, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="mt-1 h-4 w-4 shrink-0 rounded-sm border border-indigo-600/30 dark:border-indigo-400/50 bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0A0A0A] p-8 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No report card generated yet. Run the analysis engine to grade your week.</p>
                </div>
              )}
            </Card>
          </section>
        </div>
      </ProGate>
    </div>
  );
}
