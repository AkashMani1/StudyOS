"use client";

import { postJson } from "@/api/client";
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

export async function generateDailyPlan(date?: string): Promise<DailyPlanResponse> {
  return postJson<{ date?: string }, DailyPlanResponse>("/api/daily-plan", { date });
}

export async function generateWeeklyInsight(): Promise<WeeklyInsightResponse> {
  return postJson<Record<string, never>, WeeklyInsightResponse>("/api/weekly-insight", {});
}

export async function refreshLeaderboard(): Promise<LeaderboardScore[]> {
  return postJson<Record<string, never>, LeaderboardScore[]>("/api/leaderboard", {});
}
