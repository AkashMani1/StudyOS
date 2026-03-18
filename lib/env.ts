const publicEnv = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  firebaseMeasurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  firebaseDatabaseUrl: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  firebaseVapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN
};

const serverEnv = {
  sessionSecret: process.env.SESSION_SECRET,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  sentryDsn: process.env.SENTRY_DSN,
  sentryAuthToken: process.env.SENTRY_AUTH_TOKEN,
  sentryOrg: process.env.SENTRY_ORG,
  sentryProject: process.env.SENTRY_PROJECT
};

export function getPublicEnv() {
  return publicEnv;
}

export function getServerEnv() {
  return serverEnv;
}

export function requireServerEnv(name: keyof typeof serverEnv): string {
  const value = serverEnv[name];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}
