import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { generateDailyPlanForUser } from "@/lib/server-study";
import { dailyPlanSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await parseRequestBody(request, dailyPlanSchema);
    const useAi = body.useAi ?? true;

    await enforceApiRateLimit(request, {
      scope: useAi ? "daily-plan" : "daily-plan-fallback",
      limit: useAi ? 6 : 100, // 0-credit manual fills have generous limits
      windowSeconds: 3600,
      session
    });
    
    const result = await generateDailyPlanForUser(session.uid, body.date, useAi);

    return NextResponse.json(result);
  } catch (error) {
    captureServerError(error, { route: "daily-plan", uid: session.uid });
    return jsonErrorResponse(error, "Unable to generate daily plan.");
  }
}
