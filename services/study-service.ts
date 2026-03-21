"use client";

import { postJson, patchJson } from "@/api/client";
import { trackEvent } from "@/lib/analytics";
import type {
  DailyPlanResponse,
  GeneratePlanRequest,
  GeneratePlanResponse,
  GoalDoc,
  LeaderboardScore,
  RescheduleResponse,
  WeeklyInsightResponse,
  StudyPreferences
} from "@/types/domain";

export async function createGoal(uid: string, goal: GoalDoc, request: GeneratePlanRequest): Promise<GeneratePlanResponse> {
  await trackEvent("goal_created", { examName: request.examName });
  return postJson<GeneratePlanRequest, GeneratePlanResponse>("/api/goals", request);
}

export async function startSession(input: {
  taskId: string;
  sessionId: string;
  plannedDate: string;
  startTime: string;
  endTime: string;
}): Promise<void> {
  await postJson<
    {
      action: "start";
      taskId: string;
      sessionId: string;
      plannedDate: string;
      startTime: string;
      endTime: string;
    },
    { ok: true }
  >("/api/planner/session", {
    action: "start",
    taskId: input.taskId,
    sessionId: input.sessionId,
    plannedDate: input.plannedDate,
    startTime: input.startTime,
    endTime: input.endTime
  });
  await trackEvent("session_started", { sessionId: input.sessionId });
}

export async function completeSession(sessionId: string, taskId: string): Promise<void> {
  await postJson<{ action: "complete"; sessionId: string; taskId: string }, { ok: true }>("/api/planner/session", {
    action: "complete",
    sessionId,
    taskId
  });
  await trackEvent("task_completed", { taskId });
  await trackEvent("session_completed", { sessionId });
  await trackEvent("coin_earned", { taskId, source: "session_completion" });
}

export async function missSession(sessionId: string, taskId: string, reason: string): Promise<void> {
  await postJson<{ action: "miss"; sessionId: string; taskId: string; reason: string }, { ok: true }>(
    "/api/planner/session",
    {
      action: "miss",
      sessionId,
      taskId,
      reason
    }
  );
  await trackEvent("task_missed", { taskId, reason });
  await trackEvent("coin_lost", { taskId, source: "session_miss" });
}

export async function savePreferences(preferences: StudyPreferences): Promise<void> {
  await postJson<StudyPreferences, { ok: true }>("/api/preferences", preferences);
}

export async function generateDailyPlan(date?: string, useAi: boolean = true): Promise<DailyPlanResponse> {
  return postJson<{ date?: string, useAi?: boolean }, DailyPlanResponse>("/api/daily-plan", { date, useAi });
}

export async function generateWeeklyInsight(): Promise<WeeklyInsightResponse> {
  return postJson<Record<string, never>, WeeklyInsightResponse>("/api/weekly-insight", {});
}

export async function refreshLeaderboard(): Promise<LeaderboardScore[]> {
  return postJson<Record<string, never>, LeaderboardScore[]>("/api/leaderboard", {});
}

export async function createManualTask(input: {
  taskName: string;
  subject: string;
  estimatedMinutes: number;
  suggestedDay: string;
}): Promise<{ id: string }> {
  await trackEvent("manual_task_created", { subject: input.subject });
  return postJson<{
    taskName: string;
    subject: string;
    estimatedMinutes: number;
    suggestedDay: string;
  }, { id: string }>("/api/tasks", input);
}

export async function rescheduleTask(taskId: string, newDate: string): Promise<void> {
  await patchJson<{ id: string; suggestedDay: string }, { ok: true }>("/api/tasks", {
    id: taskId,
    suggestedDay: newDate
  });
}
