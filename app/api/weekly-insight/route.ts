import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { generateGeminiJson } from "@/lib/gemini";
import { getServerProfile, getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit } from "@/lib/server-request";
import type { SessionDoc, TaskDoc, WeeklyInsightResponse } from "@/types/domain";

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

    // Fetch up to the last 28 sessions (roughly a week of heavy studying)
    const sessionsSnapshot = await adminDb.collection("users").doc(session.uid).collection("sessions").get();
    const sessions = sessionsSnapshot.docs
      .map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<SessionDoc, "id">)
      }))
      .sort((a, b) => a.plannedStart.localeCompare(b.plannedStart))
      .slice(-28);
      
    // Fetch all user tasks to map subjects and task names
    const tasksSnapshot = await adminDb.collection("users").doc(session.uid).collection("tasks").get();
    const tasksMap = new Map<string, TaskDoc>();
    tasksSnapshot.docs.forEach((doc) => {
      tasksMap.set(doc.id, { id: doc.id, ...doc.data() } as TaskDoc);
    });

    const completedSessions = sessions.filter((s) => s.completed);
    const completionRate = sessions.length === 0 ? 0 : Math.round((completedSessions.length / sessions.length) * 100);

    // Build rich study history for the AI
    const historyStrings = sessions.map(s => {
      const task = tasksMap.get(s.taskId);
      const subject = task?.subject || "Unknown Subject";
      const name = task?.taskName || "Unknown Task";
      const duration = task?.estimatedMinutes || 0;
      const status = s.completed ? "COMPLETED" : `MISSED (Reason: ${s.missedReason || 'Unknown'})`;
      return `[${s.plannedStart}] ${status}: "${name}" (${subject}) - ${duration} mins`;
    });

    const fallback: WeeklyInsightResponse = {
      reportCard: {
        grade: completionRate > 80 ? "A" : completionRate > 60 ? "C" : "F",
        summary: "You completed " + completionRate + "% of your sessions. " + (completionRate < 50 ? "You need to reduce your scheduled blocks." : "Solid momentum, keep pushing.")
      },
      focusScoreFeedback: `Your focus score is ${completionRate}%. Try to cross the 80% threshold.`,
      bestStudyTimeFeedback: "You seem to miss sessions randomly. Identify a specific 2-hour window every day.",
      deepInsights: [
        "You are scheduling tasks but struggling with consistency.",
        "Consider splitting tasks into 15-minute chunks."
      ],
      actionItems: [
        "Plan fewer tasks tomorrow.",
        "Execute your first block of the day flawlessly."
      ]
    };

    const promptText = [
      "You are an elite, highly analytical, and harsh (but caring) study coach. Analyze this student's exact study log for the past week.",
      "You must return a JSON object evaluating their Focus Score, Best/Worst study times, and providing Deep Insights into their specific subjects.",
      "",
      `Overall Completion Rate (Focus Score): ${completionRate}%`,
      "--- RAW STUDY LOG ---",
      ...historyStrings,
      "---------------------",
      "",
      "CRITICAL INSTRUCTIONS:",
      "1. `reportCard.grade`: Give a letter grade (e.g. A+, B-, F) based strictly on their log and completion rate.",
      "2. `reportCard.summary`: A brutal, honest 2-sentence summary of their actual execution.",
      "3. `focusScoreFeedback`: 2 sentences analyzing their Focus Score. Don't just say the number, analyze what it means.",
      "4. `bestStudyTimeFeedback`: Identify which times of day they actually complete work vs when they miss. Be specific about the hours.",
      "5. `deepInsights`: Provide 2-3 psychological or tactical insights based on exactly WHICH subjects/tasks they avoid vs complete.",
      "6. `actionItems`: 2 specific, strict action items for next week based on their exact failures.",
      "",
      'OUTPUT STRICT JSON MATCHING THIS EXACT SCHEMA:',
      '{',
      '  "reportCard": { "grade": string, "summary": string },',
      '  "focusScoreFeedback": string,',
      '  "bestStudyTimeFeedback": string,',
      '  "deepInsights": [string, string],',
      '  "actionItems": [string, string]',
      '}'
    ].join("\n");

    const gemini = await generateGeminiJson<WeeklyInsightResponse>({
      prompt: promptText,
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
          ...gemini.data,
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
