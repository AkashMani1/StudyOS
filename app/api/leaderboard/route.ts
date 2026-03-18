import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse } from "@/lib/server-errors";
import { enforceApiRateLimit } from "@/lib/server-request";
import { getLeaderboardRows } from "@/lib/server-study";

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "leaderboard",
      limit: 12,
      windowSeconds: 3600,
      session
    });
    const rows = await getLeaderboardRows();
    return NextResponse.json(rows);
  } catch (error) {
    captureServerError(error, { route: "leaderboard", uid: session.uid });
    return jsonErrorResponse(error, "Unable to refresh leaderboard.");
  }
}
