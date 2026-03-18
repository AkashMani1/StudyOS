"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, isSupported as isMessagingSupported } from "firebase/messaging";
import { getPublicEnv } from "@/lib/env";

const env = getPublicEnv();

function requireFirebasePublicValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required public Firebase environment variable: ${name}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: requireFirebasePublicValue(env.firebaseApiKey, "NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requireFirebasePublicValue(env.firebaseAuthDomain, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: requireFirebasePublicValue(env.firebaseProjectId, "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requireFirebasePublicValue(env.firebaseStorageBucket, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireFirebasePublicValue(env.firebaseMessagingSenderId, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireFirebasePublicValue(env.firebaseAppId, "NEXT_PUBLIC_FIREBASE_APP_ID"),
  measurementId: env.firebaseMeasurementId,
  databaseURL: requireFirebasePublicValue(env.firebaseDatabaseUrl, "NEXT_PUBLIC_FIREBASE_DATABASE_URL")
};

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const rtdb = getDatabase(firebaseApp);

let analyticsInstance: Analytics | null = null;

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (typeof window === "undefined") {
    return null;
  }

  if (!(await isSupported())) {
    return null;
  }

  analyticsInstance = getAnalytics(firebaseApp);
  return analyticsInstance;
}

export async function logFirebaseEvent(
  eventName: string,
  parameters: Record<string, string | number | boolean | undefined>
): Promise<void> {
  const analytics = await getFirebaseAnalytics();

  if (!analytics) {
    return;
  }

  const filtered = Object.fromEntries(
    Object.entries(parameters).filter(([, value]) => value !== undefined)
  );
  logEvent(analytics, eventName, filtered);
}

export async function requestMessagingToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (!(await isMessagingSupported())) {
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return null;
  }

  const messaging = getMessaging(firebaseApp);
  const serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  try {
    return await getToken(messaging, {
      vapidKey: requireFirebasePublicValue(env.firebaseVapidKey, "NEXT_PUBLIC_FIREBASE_VAPID_KEY"),
      serviceWorkerRegistration
    });
  } catch {
    return null;
  }
}
