import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getServerProfile, getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { addStudentSchema } from "@/lib/validators";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const adminProfile = await getServerProfile(session.uid);

  if (!adminProfile?.instituteId) {
    return NextResponse.json({ message: "Admin is missing instituteId." }, { status: 400 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "admin-add-student",
      limit: 10,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, addStudentSchema);
    const usersSnapshot = await adminDb.collection("users").where("email", "==", body.email).limit(1).get();
    const targetUser = usersSnapshot.docs[0];

    if (!targetUser) {
      return NextResponse.json({ message: "Student not found." }, { status: 404 });
    }

    const targetProfile = targetUser.data();

    await adminDb
      .collection("institutes")
      .doc(adminProfile.instituteId)
      .collection("students")
      .doc(targetUser.id)
      .set(
        {
          email: targetProfile.email as string,
          linkedAt: new Date().toISOString(),
          linkedBy: session.uid
        },
        { merge: true }
      );

    await adminDb.collection("users").doc(targetUser.id).set(
      {
        instituteId: adminProfile.instituteId
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, uid: targetUser.id });
  } catch (error) {
    captureServerError(error, { route: "admin-add-student", uid: session.uid });
    return jsonErrorResponse(error, "Unable to add student.");
  }
}
