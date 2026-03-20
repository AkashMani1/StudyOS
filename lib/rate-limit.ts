import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export interface RateLimitOptions {
  scope: string;
  identity: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/** Extra buffer before Firestore TTL deletes the doc (1 hour) */
const TTL_BUFFER_MS = 60 * 60 * 1000;

const rateLimitCollection = () =>
  adminDb.collection("system").doc("rateLimits").collection("windows");

export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const bucketStart = Math.floor(now / (options.windowSeconds * 1000)) * options.windowSeconds;
  const docId = `${options.scope}:${options.identity}:${bucketStart}`;
  const resetAt = new Date((bucketStart + options.windowSeconds) * 1000);
  const ref = rateLimitCollection().doc(docId);

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const count = (snapshot.data()?.count as number | undefined) ?? 0;

    if (count >= options.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt
      };
    }

    transaction.set(
      ref,
      {
        scope: options.scope,
        identity: options.identity,
        count: count + 1,
        bucketStart,
        expiresAt: Timestamp.fromMillis(resetAt.getTime() + TTL_BUFFER_MS),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return {
      allowed: true,
      remaining: Math.max(options.limit - count - 1, 0),
      resetAt
    };
  });
}

/**
 * Fallback cleanup: deletes all rate-limit docs whose expiresAt has passed.
 * Call this from a cron endpoint or scheduled Cloud Function.
 * Firestore TTL policy on the `expiresAt` field is the preferred approach —
 * enable it with:
 *   gcloud firestore fields ttls update expiresAt \
 *     --collection-group=windows \
 *     --project=YOUR_PROJECT_ID
 */
export async function purgeExpiredRateLimitDocs(): Promise<number> {
  const now = Timestamp.now();
  const expired = await rateLimitCollection()
    .where("expiresAt", "<", now)
    .limit(500)
    .get();

  if (expired.empty) return 0;

  const batch = adminDb.batch();
  expired.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return expired.size;
}

