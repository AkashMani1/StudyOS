import { ZodSchema } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { HttpError } from "@/lib/server-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { SessionPayload } from "@/types/domain";

export async function parseRequestBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  try {
    const json = (await request.json()) as unknown;
    return schema.parse(json);
  } catch (error) {
    if (error instanceof Error) {
      // Handle ZodErrors more gracefully
      if ((error as any).issues) {
        const messages = (error as any).issues.map((i: any) => `${i.path.join('.')}: ${i.message}`);
        throw new HttpError(400, messages.join(', '));
      }
      throw new HttpError(400, error.message);
    }

    throw new HttpError(400, "Invalid request body.");
  }
}

export function getRequestIdentity(request: Request | NextRequest, session?: SessionPayload | null): string {
  if (session?.uid) {
    return `uid:${session.uid}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";
  return `ip:${candidate}`;
}

export async function enforceApiRateLimit(
  request: Request | NextRequest,
  options: {
    scope: string;
    limit: number;
    windowSeconds: number;
    session?: SessionPayload | null;
  }
): Promise<void> {
  const result = await enforceRateLimit({
    scope: options.scope,
    identity: getRequestIdentity(request, options.session),
    limit: options.limit,
    windowSeconds: options.windowSeconds
  });

  if (!result.allowed) {
    throw new HttpError(429, `Rate limit exceeded. Retry after ${result.resetAt.toISOString()}.`);
  }
}

export function jsonSuccess<T>(payload: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(payload, init);
}
