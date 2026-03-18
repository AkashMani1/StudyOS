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

export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const bucketStart = Math.floor(now / (options.windowSeconds * 1000)) * options.windowSeconds;
  const docId = `${options.scope}:${options.identity}:${bucketStart}`;
  const resetAt = new Date((bucketStart + options.windowSeconds) * 1000);
  const ref = adminDb.collection("system").doc("rateLimits").collection("windows").doc(docId);

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
        expiresAt: Timestamp.fromMillis(resetAt.getTime()),
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
