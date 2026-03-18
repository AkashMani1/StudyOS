import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { signSessionCookie } from "@/lib/session";
import { createSessionPayload } from "@/lib/server-study";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { parseRequestBody, enforceApiRateLimit } from "@/lib/server-request";
import { sessionBootstrapSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await enforceApiRateLimit(request, {
      scope: "session-bootstrap",
      limit: 20,
      windowSeconds: 60
    });
    const body = await parseRequestBody(request, sessionBootstrapSchema);
    const payload = await createSessionPayload(body.idToken);
    const signedCookie = signSessionCookie(payload);

    cookies().set(SESSION_COOKIE_NAME, signedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json(payload);
  } catch (error) {
    captureServerError(error, { route: "session-bootstrap" });
    return jsonErrorResponse(error, "Unable to create session.");
  }
}
