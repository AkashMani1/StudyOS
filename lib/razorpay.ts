import crypto from "crypto";
import Razorpay from "razorpay";
import { getServerEnv, requireServerEnv } from "@/lib/env";

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: requireServerEnv("razorpayKeySecret")
  });
}

export function verifyRazorpayWebhookSignature(payload: string, signature: string): boolean {
  const secret = getServerEnv().razorpayWebhookSecret;

  if (!secret) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return digest === signature;
}
