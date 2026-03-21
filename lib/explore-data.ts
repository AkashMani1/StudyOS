/**
 * Explore Mode Demo Data
 *
 * This module provides realistic but static mock data for the "Explore Mode"
 * experience — shown to unauthenticated visitors so they can preview the
 * full product before signing up. All data here is intentionally hardcoded
 * and scoped exclusively to the explore/demo flow.
 *
 * These functions are ONLY consumed by components when `user === null`.
 * Live user data is always fetched from Firestore / RTDB.
 */
import type {
  AppUserProfile,
  DailyPlanDoc,
  LeaderboardScore,
  RoomDoc,
  SessionDoc,
  TaskDoc,
  WeeklyInsightDoc
} from "@/types/domain";

function isoDay(offset = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function currentWeekDays(): string[] {
  const base = new Date();
  const day = base.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setUTCDate(monday.getUTCDate() + index);
    return current.toISOString().slice(0, 10);
  });
}

export function getExploreProfile(): AppUserProfile {
  return {
    displayName: "Explore Mode",
    avatarId: "brain",
    bio: "I am a demo student exploring the StudyOS ecosystem. I love efficient planning and deep work sessions.",
    school: "StudyOS University",
    email: "",
    role: "user",
    fcmToken: null,
    subscription: {
      plan: "pro",
      razorpaySubId: null,
      status: "active",
      validUntil: null
    },
    wallet: {
      coins: 126,
      transactions: [
        { type: "credit", amount: 25, reason: "Completed Algebra sprint", timestamp: null },
        { type: "stake", amount: -10, reason: "Missed Physics block", timestamp: null },
        { type: "credit", amount: 18, reason: "Finished Biology revision", timestamp: null }
      ]
    },
    preferences: {
      preferredStartHour: 6,
      preferredEndHour: 22,
      blockedSites: ["youtube.com", "instagram.com", "reddit.com"],
      notificationsEnabled: true,
      hardModeEnabled: true,
      publicFailureLogEnabled: false
    }
  };
}

export function getExploreTasks(): TaskDoc[] {
  const days = currentWeekDays();

  return [
    {
      id: "explore-task-1",
      subject: "Mathematics",
      taskName: "Differential equations past-paper set",
      estimatedMinutes: 90,
      priority: 5,
      suggestedDay: days[1] ?? isoDay(0),
      completed: true,
      completedAt: null,
      missedCount: 0,
      rescheduledAt: null
    },
    {
      id: "explore-task-2",
      subject: "Physics",
      taskName: "Electrostatics repair block",
      estimatedMinutes: 60,
      priority: 4,
      suggestedDay: days[2] ?? isoDay(0),
      completed: false,
      completedAt: null,
      missedCount: 1,
      rescheduledAt: null
    },
    {
      id: "explore-task-3",
      subject: "Chemistry",
      taskName: "Organic mechanism revision",
      estimatedMinutes: 75,
      priority: 4,
      suggestedDay: days[3] ?? isoDay(0),
      completed: false,
      completedAt: null,
      missedCount: 0,
      rescheduledAt: null
    },
    {
      id: "explore-task-4",
      subject: "Biology",
      taskName: "Genetics flashcard sprint",
      estimatedMinutes: 45,
      priority: 3,
      suggestedDay: days[4] ?? isoDay(0),
      completed: true,
      completedAt: null,
      missedCount: 0,
      rescheduledAt: null
    }
  ];
}

export function getExploreDailyPlans(): DailyPlanDoc[] {
  const days = currentWeekDays();

  return [
    { id: days[1] ?? isoDay(0), timeBlocks: [{ taskId: "explore-task-1", startTime: "06:30", endTime: "08:00" }] },
    { id: days[2] ?? isoDay(0), timeBlocks: [{ taskId: "explore-task-2", startTime: "18:00", endTime: "19:00" }] },
    { id: days[3] ?? isoDay(0), timeBlocks: [{ taskId: "explore-task-3", startTime: "07:00", endTime: "08:15" }] },
    { id: days[4] ?? isoDay(0), timeBlocks: [{ taskId: "explore-task-4", startTime: "20:00", endTime: "20:45" }] }
  ];
}

export function getExploreSessions(): SessionDoc[] {
  return [
    {
      id: "explore-session-1",
      taskId: "explore-task-1",
      plannedStart: `${isoDay(-3)}T06:30`,
      plannedEnd: `${isoDay(-3)}T08:00`,
      actualStart: null,
      actualEnd: null,
      completed: true
    },
    {
      id: "explore-session-2",
      taskId: "explore-task-2",
      plannedStart: `${isoDay(-2)}T18:00`,
      plannedEnd: `${isoDay(-2)}T19:00`,
      actualStart: null,
      actualEnd: null,
      completed: false,
      missedReason: "Lost focus and skipped the evening block"
    },
    {
      id: "explore-session-3",
      taskId: "explore-task-3",
      plannedStart: `${isoDay(-1)}T07:00`,
      plannedEnd: `${isoDay(-1)}T08:15`,
      actualStart: null,
      actualEnd: null,
      completed: true
    }
  ];
}

export function getExploreInsights(): WeeklyInsightDoc[] {
  return [
    {
      id: "explore-insight-1",
      generatedAt: null,
      reportCard: {
        grade: "A",
        summary: "Solid execution during high-focus morning windows. Minor session abandonment noted in late evenings."
      },
      focusScoreFeedback: "You maintain a high focus level (84%) during deep work sessions, especially when starting before 8 AM.",
      bestStudyTimeFeedback: "Your strongest window is early morning. Evening misses climb when tasks depend on mood instead of a fixed start.",
      deepInsights: [
        "Consistent Monday-Thursday consistency improves retention.",
        "Short breaks (5-10m) between focused sprints correlate with longer total study time."
      ],
      actionItems: [
        "Protect your 7:00 AM block — it's your highest ROI period.",
        "Set a harder 'No-Screens' policy after 10 PM to improve next-day morning focus."
      ]
    }
  ];
}

export function getExploreLeaderboard(): LeaderboardScore[] {
  return [
    { uid: "rank-1", displayName: "Aarav", coins: 310, completedTasks: 18, streak: 9, completionPercentage: 91 },
    { uid: "rank-2", displayName: "Diya", coins: 284, completedTasks: 16, streak: 8, completionPercentage: 88 },
    { uid: "rank-3", displayName: "Reyansh", coins: 176, completedTasks: 11, streak: 5, completionPercentage: 79 },
    { uid: "rank-4", displayName: "Kabir", coins: 119, completedTasks: 8, streak: 3, completionPercentage: 69 }
  ];
}

export function getExploreRooms(): RoomDoc[] {
  return [
    {
      id: "room-1",
      name: "JEE Deep Work Sprint",
      hostUid: "rank-1",
      isLive: true,
      isLocked: false,
      members: {
        "rank-1": { name: "Aarav", currentTask: "Calculus revision", joinedAt: 0 },
        "rank-2": { name: "Diya", currentTask: "Mock test review", joinedAt: 0 }
      }
    },
    {
      id: "room-2",
      name: "Silent Biology Hour",
      hostUid: "rank-4",
      isLive: true,
      isLocked: true,
      members: {
        "rank-4": { name: "Kabir", currentTask: "Genetics notes cleanup", joinedAt: 0 }
      }
    }
  ];
}
