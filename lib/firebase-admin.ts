import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getServerEnv } from "@/lib/env";
import { HttpError } from "@/lib/server-errors";

function createAdminApp(): App {
  const existing = getApps()[0];

  if (existing) {
    return existing;
  }

  const env = getServerEnv();
  const projectId = env.firebaseProjectId;
  const clientEmail = env.firebaseClientEmail;
  const privateKey = env.firebasePrivateKey?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new HttpError(
      500,
      "Server auth is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your server environment."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL: env.firebaseDatabaseUrl
  });
}

const adminApp = createAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);
