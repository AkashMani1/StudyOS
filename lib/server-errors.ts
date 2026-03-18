import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function captureServerError(error: unknown, context?: Record<string, string | number | boolean | undefined>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        if (value !== undefined) {
          scope.setTag(key, String(value));
        }
      });
      Sentry.captureException(error);
    });
    return;
  }

  Sentry.captureException(error);
}

export function jsonErrorResponse(error: unknown, fallback = "Internal server error."): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { message: error instanceof Error ? error.message : fallback },
    { status: 500 }
  );
}
