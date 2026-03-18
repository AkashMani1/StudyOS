import { NextResponse } from "next/server";
import { getServerProfile, getServerSession } from "@/lib/server-auth";
import {
  completePlannerSession,
  missPlannerSession,
  startPlannerSession
} from "@/lib/server-study";
import { captureServerError, jsonErrorResponse, HttpError } from "@/lib/server-errors";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { plannerSessionActionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "planner-session",
      limit: 20,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, plannerSessionActionSchema);

    if (body.action === "start") {
      const profile = await getServerProfile(session.uid);

      if (!profile) {
        throw new HttpError(404, "Profile not found.");
      }

      await startPlannerSession({
        uid: session.uid,
        taskId: body.taskId,
        sessionId: body.sessionId,
        plannedDate: body.plannedDate,
        startTime: body.startTime,
        endTime: body.endTime,
        hardModeEnabled: profile.preferences.hardModeEnabled
      });
    }

    if (body.action === "complete") {
      await completePlannerSession(session.uid, body.sessionId, body.taskId);
    }

    if (body.action === "miss") {
      await missPlannerSession({
        uid: session.uid,
        sessionId: body.sessionId,
        taskId: body.taskId,
        reason: body.reason
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureServerError(error, { route: "planner-session", uid: session.uid });
    return jsonErrorResponse(error, "Unable to process planner session.");
  }
}
