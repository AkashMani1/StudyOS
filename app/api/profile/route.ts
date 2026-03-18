import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import {
  bootstrapUserProfile,
  saveFcmTokenForUser
} from "@/lib/server-study";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { bootstrapProfileSchema, saveFcmTokenSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "profile-bootstrap",
      limit: 20,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, bootstrapProfileSchema);
    await bootstrapUserProfile(session.uid, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureServerError(error, { route: "profile-bootstrap", uid: session.uid });
    return jsonErrorResponse(error, "Unable to bootstrap profile.");
  }
}

export async function PATCH(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "profile-fcm",
      limit: 20,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, saveFcmTokenSchema);
    await saveFcmTokenForUser(session.uid, body.fcmToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureServerError(error, { route: "profile-fcm", uid: session.uid });
    return jsonErrorResponse(error, "Unable to save device token.");
  }
}
