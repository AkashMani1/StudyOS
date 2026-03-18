import { createHmac, timingSafeEqual } from "crypto";
import { requireServerEnv } from "@/lib/env";
import { HttpError } from "@/lib/server-errors";
import type { SessionPayload } from "@/types/domain";

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signSessionCookie(payload: SessionPayload): string {
  let secret: string;

  try {
    secret = requireServerEnv("sessionSecret");
  } catch {
    throw new HttpError(500, "Server auth is not configured. Add SESSION_SECRET to your server environment.");
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionCookie(cookieValue: string): SessionPayload | null {
  let secret: string;

  try {
    secret = requireServerEnv("sessionSecret");
  } catch {
    return null;
  }
  const [encodedPayload, signature] = cookieValue.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
