import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionCookieEdge } from "@/lib/session-edge";

/**
 * CSRF protection: validates that mutating requests (POST/PUT/PATCH/DELETE)
 * to API routes originate from our own domain.
 * Returns a 403 if the Origin header doesn't match the request host.
 * Exemptions: webhooks and other external-to-external routes.
 */
const CSRF_EXEMPT_PATHS = new Set(["/api/razorpay-webhook"]);

function isOriginValid(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // At least one must be present for mutating requests
  if (!origin && !referer) {
    return false;
  }

  const requestHost = request.nextUrl.host; // e.g. "localhost:3000" or "studyos.vercel.app"

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === requestHost;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === requestHost;
    } catch {
      return false;
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CSRF check for mutating API requests ──
  if (
    pathname.startsWith("/api/") &&
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    !CSRF_EXEMPT_PATHS.has(pathname)
  ) {
    if (!isOriginValid(request)) {
      return NextResponse.json(
        { message: "Forbidden: cross-origin request blocked." },
        { status: 403 }
      );
    }
  }

  // ── Auth check for protected page routes ──
  if (!pathname.startsWith("/api/")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!sessionCookie || !sessionSecret) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySessionCookieEdge(sessionCookie, sessionSecret);

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/admin") && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/planner/:path*",
    "/analytics/:path*",
    "/rooms/:path*",
    "/leaderboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/api/:path*"
  ]
};
