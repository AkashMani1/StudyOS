import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit } from "@/lib/server-request";
import { getLeaderboardRows } from "@/lib/server-study";
import { FieldValue } from "firebase-admin/firestore";

function getWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "leaderboard",
      limit: 60,
      windowSeconds: 3600,
      session
    });

    const rows = await getLeaderboardRows();
    const weekId = getWeekId();

    // Write each score to the public /leaderboard path so clients can read without burning the API
    const batch = adminDb.batch();
    for (const row of rows) {
      const ref = adminDb.collection("leaderboard").doc(weekId).collection("scores").doc(row.uid);
      batch.set(ref, {
        ...row,
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    await batch.commit();

    return NextResponse.json(rows);
  } catch (error) {
    captureServerError(error, { route: "leaderboard", uid: session.uid });
    return jsonErrorResponse(error, "Unable to refresh leaderboard.");
  }
}
