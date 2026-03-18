import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionCookie } from "@/lib/session";
import { adminDb } from "@/lib/firebase-admin";
import type { AppUserProfile, SessionPayload } from "@/types/domain";

export function getServerSession(): SessionPayload | null {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  return verifySessionCookie(sessionCookie);
}

export function requireServerSession(): SessionPayload {
  const session = getServerSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function getServerProfile(uid: string): Promise<AppUserProfile | null> {
  const snapshot = await adminDb.collection("users").doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as AppUserProfile;
}
