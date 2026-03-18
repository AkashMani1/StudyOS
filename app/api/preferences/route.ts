import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { savePreferencesForUser } from "@/lib/server-study";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { preferencesSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "preferences",
      limit: 10,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, preferencesSchema);
    await savePreferencesForUser(session.uid, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureServerError(error, { route: "preferences", uid: session.uid });
    return jsonErrorResponse(error, "Unable to save preferences.");
  }
}
