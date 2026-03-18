import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { generateGeminiJson } from "@/lib/gemini";
import { getServerProfile, getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit } from "@/lib/server-request";
import type { SessionDoc, WeeklyInsightResponse } from "@/types/domain";

function getWeekId(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-W${Math.ceil((now.getUTCDate() + 6 - now.getUTCDay()) / 7)}`;
}

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "weekly-insight",
      limit: 3,
      windowSeconds: 3600,
      session
    });
    const profile = await getServerProfile(session.uid);

    if (!profile) {
      return NextResponse.json({ message: "Profile not found." }, { status: 404 });
    }

    const sessionsSnapshot = await adminDb.collection("users").doc(session.uid).collection("sessions").get();
    const sessions = sessionsSnapshot.docs
      .map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<SessionDoc, "id">)
      }))
      .slice(-7);
    const completionRate =
      sessions.length === 0 ? 0 : Math.round((sessions.filter((item) => item.completed).length / sessions.length) * 100);
    const fallback: WeeklyInsightResponse = {
      report:
        "You wanted a report. Here is the blunt version: your recent week still has enough slippage to make your plan unreliable. The good news is that the pattern is visible. The bad news is that visibility means the excuses are getting thinner.\n\nYou are completing some sessions, but not enough of them to trust your own schedule. Missed blocks are not isolated accidents anymore. They are a habit loop. If you keep treating them as exceptions, you will stay surprised by outcomes you keep creating.\n\nAction items: shrink your first block tomorrow, protect one high-focus window, and stop scheduling fiction.",
      actionItems: [
        "Complete the first planned block before checking entertainment apps.",
        "Reduce tomorrow's most overdue task into one 25-minute sprint.",
        "Review missed sessions tonight and label the real cause."
      ]
    };
    const gemini = await generateGeminiJson<WeeklyInsightResponse>({
      prompt: [
        "You are a harsh but caring study coach. Give a 3-paragraph weekly review.",
        "Be specific about failures. Be uncomfortable to read. End with 3 concrete action items.",
        `Completion rate: ${completionRate}%`,
        `Sessions: ${sessions.map((item) => `${item.plannedStart} | completed:${item.completed}`).join("; ")}`,
        'Return JSON: {"report": string, "actionItems": [string, string, string]}'
      ].join("\n"),
      fallback
    });
    const weekId = getWeekId();

    await adminDb
      .collection("users")
      .doc(session.uid)
      .collection("insights")
      .doc(weekId)
      .set(
        {
          report: gemini.data.report,
          actionItems: gemini.data.actionItems,
          generatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    return NextResponse.json(gemini.data);
  } catch (error) {
    captureServerError(error, { route: "weekly-insight", uid: session.uid });
    return jsonErrorResponse(error, "Unable to generate weekly insight.");
  }
}
