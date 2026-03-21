import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { updateUserProfile } from "@/lib/server-study";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { profileUpdateSchema } from "@/lib/validators";
import { AppUserProfile } from "@/types/domain";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await parseRequestBody(request, profileUpdateSchema);
    const profile = await adminDb.collection("users").doc(session.uid).get();
    const data = profile.data() as AppUserProfile | undefined;

    if (data?.lastProfileUpdate) {
      const lastUpdate = (data.lastProfileUpdate as any).toDate?.() || new Date(data.lastProfileUpdate as string);
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const now = new Date();

      if (now.getTime() - lastUpdate.getTime() < thirtyDaysMs) {
        const remainingDays = Math.ceil((thirtyDaysMs - (now.getTime() - lastUpdate.getTime())) / (24 * 60 * 60 * 1000));
        return NextResponse.json(
          { message: `You can only update your profile once a month. Please wait ${remainingDays} more days.` },
          { status: 429 }
        );
      }
    }

    await enforceApiRateLimit(request, {
      scope: "profile-update",
      limit: 5,
      windowSeconds: 60,
      session
    });

    await updateUserProfile(session.uid, body);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    captureServerError(error, { route: "profile-update", uid: session.uid });
    return jsonErrorResponse(error, "Unable to update profile.");
  }
}
