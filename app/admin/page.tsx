import { redirect } from "next/navigation";
import { Timestamp } from "firebase-admin/firestore";
import { AppShell } from "@/components/app-shell";
import { AdminStudentTable } from "@/components/admin-student-table";
import { adminDb } from "@/lib/firebase-admin";
import { getServerProfile, getServerSession } from "@/lib/server-auth";
import type { StudentAdminRow } from "@/types/domain";

interface AdminTaskShape {
  subject?: string;
  completed?: boolean;
  completedAt?: Timestamp | null;
}

interface AdminSessionShape {
  completed?: boolean;
  actualStart?: Timestamp | null;
  actualEnd?: Timestamp | null;
  updatedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
}

interface AdminUserShape {
  displayName?: string;
  email?: string;
  wallet?: {
    coins?: number;
  };
  updatedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
}

function formatTimestamp(value: Timestamp | null | undefined): string {
  if (!value) {
    return "Not tracked";
  }

  return value.toDate().toISOString().slice(0, 16).replace("T", " ");
}

function getLatestTimestamp(values: Array<Timestamp | null | undefined>): Timestamp | null {
  return values.reduce<Timestamp | null>((latest, current) => {
    if (!current) {
      return latest;
    }

    if (!latest || current.toMillis() > latest.toMillis()) {
      return current;
    }

    return latest;
  }, null);
}

function getCompletionStreak(tasks: AdminTaskShape[]): number {
  const completionDays = Array.from(
    new Set(
      tasks
        .filter((task) => task.completed && task.completedAt)
        .map((task) => task.completedAt?.toDate().toISOString().slice(0, 10))
        .filter((value): value is string => Boolean(value))
    )
  ).sort();

  if (completionDays.length === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();
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

async function getAdminRows(instituteId: string): Promise<StudentAdminRow[]> {
  const studentsSnapshot = await adminDb.collection("institutes").doc(instituteId).collection("students").get();

  const rows = await Promise.all(
    studentsSnapshot.docs.map(async (entry) => {
      const uid = entry.id;
      const userRef = adminDb.collection("users").doc(uid);
      const [userSnapshot, tasksSnapshot, sessionsSnapshot] = await Promise.all([
        userRef.get(),
        userRef.collection("tasks").get(),
        userRef.collection("sessions").orderBy("createdAt", "desc").limit(90).get()
      ]);

      const user = (userSnapshot.data() ?? {}) as AdminUserShape;
      const tasks = tasksSnapshot.docs.map((task) => task.data() as AdminTaskShape);
      const sessions = sessionsSnapshot.docs.map((session) => session.data() as AdminSessionShape);
      const completedSessions = sessions.filter((session) => session.completed).length;
      const completionPercentage = sessions.length === 0 ? 0 : Math.round((completedSessions / sessions.length) * 100);
      const lastActive = formatTimestamp(
        getLatestTimestamp([
          user.updatedAt,
          user.createdAt,
          ...sessions.flatMap((session) => [session.actualEnd, session.actualStart, session.updatedAt, session.createdAt])
        ])
      );
      const subjects = Array.from(
        new Set(
          tasks
            .map((task) => task.subject?.trim())
            .filter((subject): subject is string => Boolean(subject))
        )
      ).sort();

      return {
        uid,
        name: user.displayName ?? "Unknown student",
        email: user.email ?? "unknown@example.com",
        completionPercentage,
        streak: getCompletionStreak(tasks),
        coins: user.wallet?.coins ?? 0,
        lastActive,
        subjects
      };
    })
  );

  return rows.sort((left, right) => right.completionPercentage - left.completionPercentage);
}

export default async function AdminPage() {
  const session = getServerSession();

  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const profile = await getServerProfile(session.uid);

  if (!profile?.instituteId) {
    redirect("/dashboard");
  }

  const rows = await getAdminRows(profile.instituteId);

  return (
    <AppShell
      title="Institute Admin"
      subtitle="A separate admin view for institute operators to inspect students, filter performance, and export CSV snapshots."
    >
      <AdminStudentTable rows={rows} />
    </AppShell>
  );
}
