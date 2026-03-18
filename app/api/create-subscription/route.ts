import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    { message: "StudyOS is in free launch mode. Subscriptions are not enabled." },
    { status: 501 }
  );
}
