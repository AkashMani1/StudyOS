import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
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

function createLazyProxy<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_target, property, receiver) {
      return Reflect.get(factory(), property, receiver);
    }
  });
}

export const adminAuth: Auth = createLazyProxy(() => getAuth(createAdminApp()));
export const adminDb: Firestore = createLazyProxy(() => getFirestore(createAdminApp()));
export const adminMessaging: Messaging = createLazyProxy(() => getMessaging(createAdminApp()));
