"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button, Card, Input, SectionHeading } from "@/components/ui";
import { createGoal } from "@/services/study-service";
import { generateDailyPlan } from "@/services/study-service";
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
        {
          examName,
          deadline,
          subjects,
          createdAt: null
        },
        {
          examName,
          deadline,
          subjects
        }
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
    <Card className="space-y-6">
      <SectionHeading
        eyebrow={`Step ${step} of 3`}
        title="Build your first study operating system"
        description="Tell StudyOS what exam matters, what subjects exist, and how much work you owe each one."
      />

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={examName} onChange={(event) => setExamName(event.target.value)} placeholder="Exam name" />
          <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          {subjects.map((subject, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1fr,180px,auto]">
              <Input
                value={subject.name}
                onChange={(event) => updateSubject(index, { name: event.target.value })}
                placeholder="Subject name"
              />
              <Input
                type="number"
                min={1}
                value={subject.estimatedHours}
                onChange={(event) => updateSubject(index, { estimatedHours: Number(event.target.value) })}
                placeholder="Estimated hours"
              />
              <Button
                disabled={subjects.length === 1}
                variant="ghost"
                onClick={() => setSubjects((current) => current.filter((_, subjectIndex) => subjectIndex !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setSubjects((current) => [...current, { name: "", estimatedHours: 5 }])}>
            Add subject
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/60 p-5 dark:bg-white/5">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Exam</p>
            <p className="font-display text-2xl font-bold">{examName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Deadline</p>
            <p className="font-semibold">{deadline}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Subjects</p>
            {subjects.map((subject) => (
              <div key={subject.name} className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 dark:bg-white/5">
                <span>{subject.name}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{subject.estimatedHours} hours</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep((current) => current - 1)}>
            Back
          </Button>
        ) : null}
        {step < 3 ? (
          <Button disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
            Continue
          </Button>
        ) : (
          <Button disabled={saving || !canContinue} onClick={() => void saveGoal()}>
            {saving ? "Saving..." : "Confirm and generate plan"}
          </Button>
        )}
      </div>
    </Card>
  );
}
