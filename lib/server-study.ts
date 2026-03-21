import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { generateGeminiJson } from "@/lib/gemini";
import type {
  AppUserProfile,
  DailyPlanResponse,
  GeneratePlanResponse,
  GeneratedTaskPayload,
  GoalDoc,
  LeaderboardScore,
  SessionPayload,
  StudyPreferences,
  TaskDoc,
  TimeBlock
} from "@/types/domain";

const ADMIN_EMAILS = new Set(["akashmani9955@gmail.com"]);

function getPrivilegedDefaults(email: string | null | undefined): Pick<AppUserProfile, "role" | "subscription"> {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  if (ADMIN_EMAILS.has(normalizedEmail)) {
    return {
      role: "admin",
      subscription: {
        plan: "pro",
        razorpaySubId: null,
        status: "active",
        validUntil: null
      }
    };
  }

  return {
    role: "user",
    subscription: {
      plan: "pro",
      razorpaySubId: null,
      status: "active",
      validUntil: null
    }
  };
}

function normalizePriority(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return Math.round(value) as 1 | 2 | 3 | 4 | 5;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function fallbackPlan(deadline: string, subjects: { name: string; estimatedHours: number }[]): GeneratedTaskPayload[] {
  const today = new Date();
  const dueDate = new Date(deadline);
  const dayCount = Math.max(Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 1);

  return subjects.flatMap((subject, subjectIndex) => {
    const totalMinutes = subject.estimatedHours * 60;
    const chunkCount = Math.max(Math.ceil(totalMinutes / 90), 1);
    const chunkMinutes = Math.max(Math.ceil(totalMinutes / chunkCount), 30);

    return Array.from({ length: chunkCount }, (_, index) => {
      const suggested = addDays(today, Math.min(index + subjectIndex, dayCount - 1)).toISOString().slice(0, 10);

      return {
        subject: subject.name,
        taskName: `${subject.name} sprint ${index + 1}`,
        estimatedMinutes: chunkMinutes,
        priority: normalizePriority(5 - Math.floor(index / 2)),
        suggestedDay: suggested
      };
    });
  });
}

function sanitizeTasks(input: GeneratedTaskPayload[], fallback: GeneratedTaskPayload[]): GeneratedTaskPayload[] {
  if (input.length === 0) {
    return fallback;
  }

  return input.map((task, index) => {
    const seed = fallback[index % fallback.length];

    return {
      subject: task.subject?.trim() || seed.subject,
      taskName: task.taskName?.trim() || seed.taskName,
      estimatedMinutes: Number.isFinite(task.estimatedMinutes) ? Math.max(25, Math.round(task.estimatedMinutes)) : seed.estimatedMinutes,
      priority: normalizePriority(task.priority),
      suggestedDay: /^\d{4}-\d{2}-\d{2}$/.test(task.suggestedDay) ? task.suggestedDay : seed.suggestedDay
    };
  });
}

function isoDateWithOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildTimeBlocks(tasks: Pick<TaskDoc, "id" | "estimatedMinutes">[]): TimeBlock[] {
  let hour = 6;
  let minute = 0;

  return tasks.map((task) => {
    const startHour = String(hour).padStart(2, "0");
    const startMinute = String(minute).padStart(2, "0");
    const endTotal = hour * 60 + minute + task.estimatedMinutes;
    const endHour = String(Math.floor(endTotal / 60)).padStart(2, "0");
    const endMinute = String(endTotal % 60).padStart(2, "0");
    hour = Math.floor(endTotal / 60);
    minute = endTotal % 60;

    return {
      taskId: task.id,
      startTime: `${startHour}:${startMinute}`,
      endTime: `${endHour}:${endMinute}`
    };
  });
}

function buildFallbackDailyPlan(
  tasks: Array<{ id: string; estimatedMinutes: number }>,
  startHour: number
): Array<{ taskId: string; startTime: string; endTime: string }> {
  let cursor = startHour * 60;

  return tasks.map((task) => {
    const startTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
    cursor += task.estimatedMinutes;
    const endTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
    return {
      taskId: task.id,
      startTime,
      endTime
    };
  });
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function upsertDailyPlans(uid: string, taskIds: string[]): Promise<void> {
  const tasks = await Promise.all(
    taskIds.map(async (taskId) => {
      const snapshot = await adminDb.collection("users").doc(uid).collection("tasks").doc(taskId).get();
      const data = snapshot.data() as Omit<TaskDoc, "id"> | undefined;
      return data ? { id: snapshot.id, ...data } : null;
    })
  );

  const grouped = tasks.filter(Boolean).reduce<Record<string, Pick<TaskDoc, "id" | "estimatedMinutes">[]>>((accumulator, task) => {
    if (!task) {
      return accumulator;
    }

    const current = accumulator[task.suggestedDay] ?? [];
    current.push({ id: task.id, estimatedMinutes: task.estimatedMinutes });
    accumulator[task.suggestedDay] = current;
    return accumulator;
  }, {});

  await Promise.all(
    Object.entries(grouped).map(([date, dayTasks]) =>
      adminDb
        .collection("users")
        .doc(uid)
        .collection("dailyPlans")
        .doc(date)
        .set(
          {
            timeBlocks: buildTimeBlocks(dayTasks),
            generatedAt: FieldValue.serverTimestamp()
          },
          { merge: true }
        )
    )
  );
}

async function redistributeOverdueTasks(uid: string): Promise<string[]> {
  const overdueSnapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("tasks")
    .where("completed", "==", false)
    .where("suggestedDay", "<", new Date().toISOString().slice(0, 10))
    .get();

  const overdueTasks = overdueSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TaskDoc, "id">)
  }));

  if (overdueTasks.length < 3) {
    return [];
  }

  const fallback = overdueTasks.map((task, index) => ({
    taskId: task.id,
    suggestedDay: isoDateWithOffset((index % 3) + 1)
  }));
  const gemini = await generateGeminiJson<{ taskId: string; suggestedDay: string }[]>({
    prompt: [
      "Redistribute overdue tasks across the next available days.",
      `Tasks: ${overdueTasks.map((task) => `${task.id}:${task.taskName}:${task.estimatedMinutes}m`).join(", ")}`,
      'Return JSON array objects with taskId and suggestedDay.'
    ].join("\n"),
    fallback
  });

  await Promise.all(
    gemini.data.map((item) =>
      adminDb
        .collection("users")
        .doc(uid)
        .collection("tasks")
        .doc(item.taskId)
        .set(
          {
            suggestedDay: /^\d{4}-\d{2}-\d{2}$/.test(item.suggestedDay) ? item.suggestedDay : isoDateWithOffset(1),
            rescheduledAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          },
          { merge: true }
        )
    )
  );

  return gemini.data.map((item) => item.taskId);
}

export async function generateDailyPlanForUser(uid: string, dateInput?: string, useAi: boolean = true): Promise<DailyPlanResponse> {
  const targetDate = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : todayIsoDate();
  const [profileSnapshot, tasksSnapshot] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb
      .collection("users")
      .doc(uid)
      .collection("tasks")
      .where("completed", "==", false)
      .where("suggestedDay", "<=", targetDate)
      .limit(6)
      .get()
  ]);

  const taskEntries = tasksSnapshot.docs.map((entry) => ({
    id: entry.id,
    ...(entry.data() as Omit<TaskDoc, "id">)
  }));

  if (taskEntries.length === 0) {
    await adminDb.collection("users").doc(uid).collection("dailyPlans").doc(targetDate).set(
      {
        timeBlocks: [],
        generatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return {
      date: targetDate,
      blockCount: 0,
      usedFallback: true
    };
  }

  const profile = profileSnapshot.data() as AppUserProfile | undefined;
  const fallback = buildFallbackDailyPlan(
    taskEntries.map((task) => ({ id: task.id, estimatedMinutes: task.estimatedMinutes })),
    profile?.preferences.preferredStartHour ?? 6
  );
  if (!useAi) {
    await adminDb.collection("users").doc(uid).collection("dailyPlans").doc(targetDate).set(
      {
        timeBlocks: fallback,
        generatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return {
      date: targetDate,
      blockCount: fallback.length,
      usedFallback: true
    };
  }

  const gemini = await generateGeminiJson<Array<{ taskId: string; startTime: string; endTime: string }>>({
    prompt: [
      "Build today's study plan from these tasks.",
      `Tasks: ${taskEntries.map((task) => `${task.id}:${task.taskName}:${task.estimatedMinutes}`).join(", ")}`,
      `Preferred window: ${profile?.preferences.preferredStartHour ?? 6}:00 to ${profile?.preferences.preferredEndHour ?? 22}:00`,
      'Return JSON array objects with taskId, startTime, endTime.'
    ].join("\n"),
    fallback
  });

  await adminDb.collection("users").doc(uid).collection("dailyPlans").doc(targetDate).set(
    {
      timeBlocks: gemini.data,
      generatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return {
    date: targetDate,
    blockCount: gemini.data.length,
    usedFallback: gemini.usedFallback
  };
}

function uniqueCount(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getStreakFromSessions(sessions: Array<Pick<TaskDoc, "completedAt"> & { completed: boolean }>): number {
  const completionDays = uniqueCount(
    sessions
      .filter((session) => session.completed && session.completedAt)
      .map((session) => session.completedAt?.toDate?.().toISOString().slice(0, 10) ?? "")
      .filter(Boolean)
  );

  if (completionDays.length === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);

    if (!completionDays.includes(iso)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0-6 (Sun-Sat)
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
  return monday;
}

export async function getLeaderboardRows(): Promise<LeaderboardScore[]> {
  const startOfWeek = getStartOfWeek();
  const startOfWeekMs = startOfWeek.getTime();

  const usersSnapshot = await adminDb
    .collection("users")
    .orderBy("wallet.coins", "desc") // Still use total coins for initial subset, or just get all active
    .limit(100)
    .get();

  const rows = await Promise.all(
    usersSnapshot.docs.map(async (userDoc) => {
      const user = userDoc.data() as AppUserProfile;
      const [sessionsSnapshot, publicFailureSnapshot] = await Promise.all([
        userDoc.ref.collection("sessions").where("createdAt", ">=", startOfWeek).get(),
        adminDb.collection("publicFailures").doc(userDoc.id).collection(todayIsoDate()).doc("summary").get()
      ]);

      const sessions = sessionsSnapshot.docs.map((entry) => entry.data() as {
        completed: boolean;
        completedAt?: { toDate?: () => Date } | null;
      });

      // Calculate Weekly Coins from transactions
      const weeklyCoins = (user.wallet.transactions || [])
        .filter((t) => {
          const ts = (t.timestamp as any)?.toDate?.()?.getTime() || (t.timestamp as any)?.getTime() || 0;
          return ts >= startOfWeekMs;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const completedTasks = sessions.filter((entry) => entry.completed).length;
      const completionPercentage = sessions.length === 0 ? 0 : Math.round((completedTasks / sessions.length) * 100);
      const publicFailure = publicFailureSnapshot.data() as { missedTasks?: string[] } | undefined;

      return {
        uid: userDoc.id,
        displayName: user.displayName,
        coins: Math.max(0, weeklyCoins), // Fresh score for the week
        completedTasks,
        streak: getStreakFromSessions(
          sessions.map((session) => ({
            completed: session.completed,
            completedAt: (session.completedAt as TaskDoc["completedAt"]) ?? null
          }))
        ),
        completionPercentage,
        failureSummary: publicFailure?.missedTasks?.length
          ? `Missed ${publicFailure.missedTasks.length} tasks today`
          : null
      };
    })
  );

  return rows.sort((left, right) => {
    if (right.coins !== left.coins) {
      return right.coins - left.coins;
    }

    return right.completionPercentage - left.completionPercentage;
  });
}

export async function bootstrapUserProfile(uid: string, payload: {
  displayName: string;
  email: string;
  fcmToken?: string | null;
}): Promise<void> {
  const defaultProfile: Pick<AppUserProfile, "role" | "subscription" | "wallet" | "preferences"> = {
    ...getPrivilegedDefaults(payload.email),
    wallet: {
      coins: 0,
      transactions: []
    },
    preferences: {
      preferredStartHour: 6,
      preferredEndHour: 22,
      blockedSites: [],
      notificationsEnabled: true,
      hardModeEnabled: false,
      publicFailureLogEnabled: false
    }
  };

  await adminDb.collection("users").doc(uid).set(
    {
      displayName: payload.displayName,
      email: payload.email,
      fcmToken: payload.fcmToken ?? null,
      ...defaultProfile,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function savePreferencesForUser(uid: string, preferences: StudyPreferences): Promise<void> {
  await adminDb.collection("users").doc(uid).set(
    {
      preferences,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveFcmTokenForUser(uid: string, fcmToken: string): Promise<void> {
  await adminDb.collection("users").doc(uid).set(
    {
      fcmToken,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function createGoalAndTasksForUser(
  uid: string,
  goal: GoalDoc,
  input: { examName: string; deadline: string; subjects: { name: string; estimatedHours: number }[] }
): Promise<GeneratePlanResponse> {
  await adminDb.collection("users").doc(uid).collection("goals").add({
    ...goal,
    createdAt: FieldValue.serverTimestamp()
  });

  const fallback = fallbackPlan(input.deadline, input.subjects);
  const prompt = [
    "You are designing a study plan.",
    `Exam: ${input.examName}`,
    `Deadline: ${input.deadline}`,
    `Subjects: ${input.subjects.map((subject) => `${subject.name} (${subject.estimatedHours} hours)`).join(", ")}`,
    'Return a JSON array of objects with keys: subject, taskName, estimatedMinutes, priority, suggestedDay.'
  ].join("\n");

  const gemini = await generateGeminiJson<GeneratedTaskPayload[]>({
    prompt,
    fallback
  });
  const tasks = sanitizeTasks(gemini.data, fallback);
  const batch = adminDb.batch();

  tasks.forEach((task) => {
    const ref = adminDb.collection("users").doc(uid).collection("tasks").doc();
    batch.set(ref, {
      ...task,
      completed: false,
      completedAt: null,
      missedCount: 0,
      rescheduledAt: null,
      splitFromTaskId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  await batch.commit();

  return {
    tasks,
    usedFallback: gemini.usedFallback
  };
}

export async function startPlannerSession(input: {
  uid: string;
  taskId: string;
  sessionId: string;
  plannedDate: string;
  startTime: string;
  endTime: string;
  hardModeEnabled: boolean;
}): Promise<void> {
  const taskSnapshot = await adminDb.collection("users").doc(input.uid).collection("tasks").doc(input.taskId).get();

  if (!taskSnapshot.exists) {
    throw new Error("Task not found.");
  }

  await adminDb.collection("users").doc(input.uid).collection("sessions").doc(input.sessionId).set(
    {
      taskId: input.taskId,
      plannedStart: `${input.plannedDate}T${input.startTime}`,
      plannedEnd: `${input.plannedDate}T${input.endTime}`,
      actualStart: FieldValue.serverTimestamp(),
      actualEnd: null,
      completed: false,
      stakeAmount: input.hardModeEnabled ? 10 : 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function completePlannerSession(uid: string, sessionId: string, taskId: string): Promise<void> {
  const sessionRef = adminDb.collection("users").doc(uid).collection("sessions").doc(sessionId);
  const taskRef = adminDb.collection("users").doc(uid).collection("tasks").doc(taskId);
  const [sessionSnapshot, taskSnapshot] = await Promise.all([sessionRef.get(), taskRef.get()]);

  if (!sessionSnapshot.exists || !taskSnapshot.exists) {
    throw new Error("Session or task not found.");
  }

  const batch = adminDb.batch();
  batch.set(sessionRef,
    {
      actualEnd: FieldValue.serverTimestamp(),
      completed: true,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  batch.set(taskRef,
    {
      completed: true,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  
  // Award 20 Coins using dot-notation for nested field safety
  batch.update(adminDb.collection("users").doc(uid), {
    "wallet.coins": FieldValue.increment(20),
    "wallet.transactions": FieldValue.arrayUnion({
      type: "credit",
      amount: 20,
      reason: "Manual Focus Complete",
      timestamp: new Date(), // FieldValue.serverTimestamp() not allowed in arrayUnion
    })
  });

  await batch.commit();
}

export async function rescheduleTaskForUser(uid: string, taskId: string): Promise<string[]> {
  const taskRef = adminDb.collection("users").doc(uid).collection("tasks").doc(taskId);
  const taskSnapshot = await taskRef.get();

  if (!taskSnapshot.exists) {
    throw new Error("Task not found.");
  }

  const task = {
    id: taskSnapshot.id,
    ...(taskSnapshot.data() as Omit<TaskDoc, "id">)
  };
  const updatedTaskIds: string[] = [];
  const profileSnapshot = await adminDb.collection("users").doc(uid).get();
  const publicFailureLogEnabled =
    (profileSnapshot.data()?.preferences?.publicFailureLogEnabled as boolean | undefined) ?? false;

  if (task.missedCount >= 3) {
    const fallback: GeneratedTaskPayload[] = [
      {
        subject: task.subject,
        taskName: `${task.taskName} - Part 1`,
        estimatedMinutes: Math.max(Math.ceil(task.estimatedMinutes / 2), 25),
        priority: task.priority,
        suggestedDay: isoDateWithOffset(1)
      },
      {
        subject: task.subject,
        taskName: `${task.taskName} - Part 2`,
        estimatedMinutes: Math.max(Math.floor(task.estimatedMinutes / 2), 25),
        priority: task.priority,
        suggestedDay: isoDateWithOffset(2)
      }
    ];
    const gemini = await generateGeminiJson<GeneratedTaskPayload[]>({
      prompt: [
        "Split this task into exactly two smaller tasks.",
        `Task: ${task.taskName}`,
        `Subject: ${task.subject}`,
        `Estimated minutes: ${task.estimatedMinutes}`,
        'Return JSON array objects with subject, taskName, estimatedMinutes, priority, suggestedDay.'
      ].join("\n"),
      fallback
    });
    const [first, second] = gemini.data.length >= 2 ? gemini.data : fallback;
    await taskRef.set(
      {
        taskName: first.taskName,
        estimatedMinutes: first.estimatedMinutes,
        suggestedDay: first.suggestedDay,
        rescheduledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    updatedTaskIds.push(task.id);
    const secondRef = adminDb.collection("users").doc(uid).collection("tasks").doc();
    await secondRef.set({
      ...second,
      completed: false,
      completedAt: null,
      missedCount: 0,
      rescheduledAt: FieldValue.serverTimestamp(),
      splitFromTaskId: task.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    updatedTaskIds.push(secondRef.id);
  } else {
    await taskRef.set(
      {
        suggestedDay: isoDateWithOffset(1),
        rescheduledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    updatedTaskIds.push(task.id);
  }

  const redistributed = await redistributeOverdueTasks(uid);
  updatedTaskIds.push(...redistributed);
  await upsertDailyPlans(uid, updatedTaskIds);

  if (publicFailureLogEnabled) {
    const today = new Date().toISOString().slice(0, 10);
    await adminDb
      .collection("publicFailures")
      .doc(uid)
      .collection(today)
      .doc("summary")
      .set(
        {
          missedTasks: FieldValue.arrayUnion(task.taskName),
          visibleTo: "public",
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );
  }

  return updatedTaskIds;
}

export async function missPlannerSession(input: {
  uid: string;
  sessionId: string;
  taskId: string;
  reason: string;
}): Promise<string[]> {
  const sessionRef = adminDb.collection("users").doc(input.uid).collection("sessions").doc(input.sessionId);
  const taskRef = adminDb.collection("users").doc(input.uid).collection("tasks").doc(input.taskId);
  const [sessionSnapshot, taskSnapshot] = await Promise.all([sessionRef.get(), taskRef.get()]);

  if (!sessionSnapshot.exists || !taskSnapshot.exists) {
    throw new Error("Session or task not found.");
  }

  const batch = adminDb.batch();
  batch.set(sessionRef,
    {
      actualEnd: FieldValue.serverTimestamp(),
      completed: false,
      missedReason: input.reason,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  batch.set(taskRef,
    {
      missedCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  // Penalize 10 Coins
  batch.update(adminDb.collection("users").doc(input.uid), {
    "wallet.coins": FieldValue.increment(-10),
    "wallet.transactions": FieldValue.arrayUnion({
      type: "debit",
      amount: 10,
      reason: "Focus Session Forfeited",
      timestamp: new Date(), 
    })
  });

  await batch.commit();

  return [input.taskId];
}

export async function createSessionPayload(idToken: string): Promise<SessionPayload> {
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const profileSnapshot = await adminDb.collection("users").doc(decodedToken.uid).get();
  const profile = profileSnapshot.data() as AppUserProfile | undefined;
  const privilegedDefaults = getPrivilegedDefaults(decodedToken.email);

  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? "",
    displayName: decodedToken.name ?? profile?.displayName ?? "Focused Student",
    role: profile?.role ?? privilegedDefaults.role,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  };
}

export async function updateUserProfile(uid: string, profile: {
  displayName?: string;
  bio?: string;
  school?: string;
  avatarId?: string;
}): Promise<void> {
  await adminDb.collection("users").doc(uid).set(
    {
      ...profile,
      lastProfileUpdate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}
