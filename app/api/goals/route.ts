import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { createGoalAndTasksForUser } from "@/lib/server-study";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { goalCreateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "goals",
      limit: 4,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, goalCreateSchema);
    const result = await createGoalAndTasksForUser(
      session.uid,
      {
        examName: body.examName,
        deadline: body.deadline,
        subjects: body.subjects,
        createdAt: null
      },
      body
    );

    return NextResponse.json(result);
  } catch (error) {
    captureServerError(error, { route: "goals", uid: session.uid });
    return jsonErrorResponse(error, "Unable to create goal.");
  }
}
