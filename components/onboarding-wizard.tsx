"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, BookOpen, Calendar, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui";
import { createGoal } from "@/services/study-service";
import { generateDailyPlan } from "@/services/study-service";
import { cn } from "@/lib/utils";
import type { SubjectInput } from "@/types/domain";

export function OnboardingWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [examName, setExamName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [subjects, setSubjects] = useState<SubjectInput[]>([{ name: "", estimatedHours: 10 }]);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return examName.trim().length > 1 && deadline.length > 0;
    }
    return subjects.every((subject) => subject.name.trim() && subject.estimatedHours > 0);
  }, [deadline, examName, step, subjects]);

  const updateSubject = (index: number, value: Partial<SubjectInput>) => {
    setSubjects((current) =>
      current.map((subject, subjectIndex) => (subjectIndex === index ? { ...subject, ...value } : subject))
    );
  };

  const saveGoal = async () => {
    if (!user) {
      toast.error("Please sign in to create your profile and save your study plan.");
      router.push("/login?redirect=/onboarding");
      return;
    }

    setSaving(true);
    try {
      const response = await createGoal(
        user.uid,
        { examName, deadline, subjects, createdAt: null },
        { examName, deadline, subjects }
      );
      await generateDailyPlan();
      toast.success(response.usedFallback ? "Goal saved with a fallback plan and your first day was generated." : "Goal saved and your first study day is ready.");
      router.refresh();
      router.push("/planner");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to finish onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Step {step} of 3</p>
        <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          {step === 1 && "What are you studying for?"}
          {step === 2 && "Break it down by subject"}
          {step === 3 && "Review your study plan"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
          {step === 1 && "Give your goal a name and set the ultimate deadline. The AI will work backwards from this date."}
          {step === 2 && "List the core subjects required for this exam and a rough estimate of the hours needed for each."}
          {step === 3 && "Confirm your inputs before StudyOS generates your dynamic timeline."}
        </p>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white/50 p-6 md:p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0A0A0A]/80">
        
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Exam Target</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. USMLE Step 1, AWS Certified Developer"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-500 transition-all text-lg"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-500 transition-all text-lg [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {subjects.map((subject, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center gap-3 relative animate-in slide-in-from-left-2 duration-300">
                <input
                  value={subject.name}
                  onChange={(e) => updateSubject(index, { name: e.target.value })}
                  placeholder="Subject name"
                  className="w-full md:flex-1 rounded-xl border border-slate-200 bg-white py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  autoFocus={index === subjects.length - 1}
                />
                <div className="w-full md:w-32 relative">
                  <input
                    type="number"
                    min={1}
                    value={subject.estimatedHours || ""}
                    onChange={(e) => updateSubject(index, { estimatedHours: Number(e.target.value) })}
                    placeholder="Hours"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-8 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 opacity-70">hr</span>
                </div>
                <button
                  disabled={subjects.length === 1}
                  onClick={() => setSubjects((current) => current.filter((_, subjectIndex) => subjectIndex !== index))}
                  className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30 self-end md:self-auto"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            
            <button
              onClick={() => setSubjects((current) => [...current, { name: "", estimatedHours: 5 }])}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-white/20 dark:hover:bg-white/5 dark:hover:text-white transition-all group"
            >
              <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Add another subject
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 dark:border-indigo-500/20 dark:bg-indigo-500/5">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-indigo-400/70">Exam Goal</p>
                  <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">{examName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-indigo-400/70">Target Deadline</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{deadline}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Subject Breakdown</p>
              <div className="space-y-2">
                {subjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{subject.name}</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{subject.estimatedHours} hours</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 px-2 flex justify-end">
                <p className="text-sm font-medium text-slate-500">
                  Total load: <strong className="text-slate-900 dark:text-white">{subjects.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)} hours</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-white/10">
          {step > 1 ? (
            <button
              onClick={() => setStep((current) => current - 1)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              disabled={!canContinue}
              onClick={() => setStep((current) => current + 1)}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all duration-300",
                canContinue 
                  ? "bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-md shadow-indigo-500/20" 
                  : "bg-slate-300 dark:bg-white/10 cursor-not-allowed opacity-50"
              )}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled={saving || !canContinue}
              onClick={() => void saveGoal()}
              className={cn(
                "flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-white transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]",
                saving || !canContinue 
                  ? "bg-indigo-500/50 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-500 hover:scale-105"
              )}
            >
              {saving ? "Generating Plan..." : "Confirm and generate plan"}
              {!saving && <ArrowRight className="h-5 w-5 ml-1" />}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
