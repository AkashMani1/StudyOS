import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { captureServerError, jsonErrorResponse, HttpError } from "@/lib/server-errors";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const createTaskSchema = z.object({
  taskName: z.string().min(2).max(100),
  subject: z.string().min(1).max(50),
  estimatedMinutes: z.number().int().min(10).max(600),
  suggestedDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    // Generous rate limit since this is manual and uses 0 AI credits
    await enforceApiRateLimit(request, {
      scope: "manual-task-creation",
      limit: 100,
      windowSeconds: 3600,
      session
    });
    
    const body = await parseRequestBody(request, createTaskSchema);
    
    const ref = adminDb.collection("users").doc(session.uid).collection("tasks").doc();
    
    const taskData = {
      taskName: body.taskName,
      subject: body.subject,
      estimatedMinutes: body.estimatedMinutes,
      suggestedDay: body.suggestedDay,
      priority: 3, // Default normal priority
      completed: false,
      completedAt: null,
      missedCount: 0,
      rescheduledAt: null,
      splitFromTaskId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await ref.set(taskData);

    return NextResponse.json({ id: ref.id, ...taskData });
  } catch (error) {
    captureServerError(error, { route: "create-task", uid: session.uid });
    return jsonErrorResponse(error, "Unable to create manual task.");
  }
}

const updateTaskSchema = z.object({
  id: z.string(),
  suggestedDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export async function PATCH(request: Request) {
  const session = getServerSession();
  if (!session) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  try {
    const body = await parseRequestBody(request, updateTaskSchema);
    const ref = adminDb.collection("users").doc(session.uid).collection("tasks").doc(body.id);
    
    await ref.update({
      suggestedDay: body.suggestedDay,
      rescheduledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureServerError(error, { route: "update-task", uid: session.uid });
    return jsonErrorResponse(error, "Unable to reschedule task.");
  }
}
