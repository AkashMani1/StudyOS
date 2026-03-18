import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { rescheduleTaskForUser } from "@/lib/server-study";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { rescheduleSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "reschedule",
      limit: 12,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, rescheduleSchema);
    const updatedTaskIds = await rescheduleTaskForUser(session.uid, body.taskId);

    return NextResponse.json({
      status: updatedTaskIds.length === 0 ? "noop" : "ok",
      updatedTaskIds
    });
  } catch (error) {
    captureServerError(error, { route: "reschedule", uid: session.uid });
    return jsonErrorResponse(error, "Unable to reschedule tasks.");
  }
}
