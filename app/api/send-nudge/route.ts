import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { generateGeminiJson } from "@/lib/gemini";
import { getServerProfile, getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit } from "@/lib/server-request";
import type { DailyPlanDoc, NudgeResponse, SessionDoc } from "@/types/domain";

function minutesUntil(targetTime: string): number {
  const now = new Date();
  const [hour, minute] = targetTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60));
}

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "send-nudge",
      limit: 10,
      windowSeconds: 3600,
      session
    });
    const profile = await getServerProfile(session.uid);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const todayPlanSnapshot = await adminDb.collection("users").doc(session.uid).collection("dailyPlans").doc(today).get();
    const yesterdaySessionsSnapshot = await adminDb.collection("users").doc(session.uid).collection("sessions").get();
    const todayPlan = todayPlanSnapshot.data() as DailyPlanDoc | undefined;
    const yesterdayMiss = yesterdaySessionsSnapshot.docs
      .map((doc) => doc.data() as SessionDoc)
      .some((entry) => entry.plannedStart.startsWith(yesterday) && !entry.completed);
    const upcomingBlock = todayPlan?.timeBlocks.find((block) => {
      const remaining = minutesUntil(block.startTime);
      return remaining >= 0 && remaining <= 15;
    });

    if (!upcomingBlock || !yesterdayMiss) {
      return NextResponse.json({
        status: "skipped",
        message: "No qualifying nudge condition met."
      } satisfies NudgeResponse);
    }

    const fallback: NudgeResponse = {
      status: "sent",
      message: "You skipped this slot yesterday. Do not repeat the same weakness in the same place."
    };
    const gemini = await generateGeminiJson<{ message: string }>({
      prompt: [
        "Generate a short personal harsh nudge message.",
        `Student: ${profile?.displayName ?? "Student"}`,
        `Upcoming block: ${upcomingBlock.startTime} - ${upcomingBlock.endTime}`,
        "Yesterday, the student skipped the same time slot.",
        'Return JSON: {"message": string}'
      ].join("\n"),
      fallback: { message: fallback.message }
    });
    const message = gemini.data.message || fallback.message;

    if (profile?.fcmToken) {
      await adminMessaging.send({
        token: profile.fcmToken,
        notification: {
          title: "StudyOS nudge",
          body: message
        },
        webpush: {
          notification: {
            body: message
          },
          fcmOptions: {
            link: "https://example.com/planner"
          }
        }
      });
    }

    return NextResponse.json({
      status: "sent",
      message
    } satisfies NudgeResponse);
  } catch (error) {
    captureServerError(error, { route: "send-nudge", uid: session.uid });
    return jsonErrorResponse(error, "Unable to send nudge.");
  }
}
