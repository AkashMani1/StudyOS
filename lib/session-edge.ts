import type { SessionPayload } from "@/types/domain";

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/**
 * Constant-time comparison of two strings to prevent timing attacks.
 * Both strings are encoded to bytes and XORed element-wise;
 * the accumulated mismatch value is checked at the end so
 * the comparison always takes the same amount of time.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.length !== bufB.length) {
    // Still perform a full loop to avoid leaking length info via timing.
    // Use the longer buffer as the iteration count.
    const maxLen = Math.max(bufA.length, bufB.length);
    let mismatch = 1; // start with a mismatch since lengths differ
    for (let i = 0; i < maxLen; i++) {
      mismatch |= (bufA[i % bufA.length] ?? 0) ^ (bufB[i % bufB.length] ?? 0);
    }
    return mismatch === 0; // always false, but in constant time
  }

  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }
  return mismatch === 0;
}

async function createSignature(encodedPayload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  const binary = Array.from(new Uint8Array(signature))
    .map((value) => String.fromCharCode(value))
    .join("");

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function verifySessionCookieEdge(
  cookieValue: string,
  secret: string
): Promise<SessionPayload | null> {
  const [encodedPayload, signature] = cookieValue.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = await createSignature(encodedPayload, secret);

  if (!constantTimeEqual(signature, expected)) {
    return null;
  }

  try {
    const json = new TextDecoder().decode(decodeBase64Url(encodedPayload));
    const payload = JSON.parse(json) as SessionPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
