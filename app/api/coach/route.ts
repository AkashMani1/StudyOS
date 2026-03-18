import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getServerProfile, getServerSession } from "@/lib/server-auth";
import { safeJsonParse } from "@/lib/utils";
import { captureServerError } from "@/lib/server-errors";
import { coachRequestSchema } from "@/lib/validators";
import { enforceApiRateLimit, parseRequestBody } from "@/lib/server-request";
import type { CoachRequest, SessionDoc, TaskDoc } from "@/types/domain";

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function extractText(chunk: GeminiStreamChunk): string {
  return chunk.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("") ?? "";
}

export async function POST(request: Request) {
  const session = getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const profile = await getServerProfile(session.uid);

  if (!profile) {
    return NextResponse.json({ message: "Profile not found." }, { status: 404 });
  }

  try {
    await enforceApiRateLimit(request, {
      scope: "coach",
      limit: 8,
      windowSeconds: 60,
      session
    });
    const body = await parseRequestBody(request, coachRequestSchema) as CoachRequest;
    const [tasksSnapshot, sessionsSnapshot] = await Promise.all([
      adminDb.collection("users").doc(session.uid).collection("tasks").limit(12).get(),
      adminDb.collection("users").doc(session.uid).collection("sessions").limit(12).get()
    ]);
    const tasks = tasksSnapshot.docs.map((entry) => entry.data() as TaskDoc);
    const sessions = sessionsSnapshot.docs.map((entry) => entry.data() as SessionDoc);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key missing.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are a strict, harsh, personal study coach. Be direct. Be uncomfortable. Reference the student's actual data. No fluff."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    `Student: ${profile.displayName}`,
                    `Current prompt: ${body.prompt}`,
                    `Tasks: ${tasks.map((task) => `${task.taskName} (${task.subject}) completed:${task.completed}`).join("; ")}`,
                    `Sessions: ${sessions.map((entry) => `${entry.plannedStart} completed:${entry.completed}`).join("; ")}`
                  ].join("\n")
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok || !response.body) {
      throw new Error(`Gemini streaming failed with ${response.status}`);
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = response.body?.getReader();

        if (!reader) {
          controller.enqueue(
            encoder.encode(
              "Fallback coach: Your next fix is not another long plan. It is one small overdue task done before your first distraction."
            )
          );
          controller.close();
          return;
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          events.forEach((event) => {
            const dataLine = event
              .split("\n")
              .find((line) => line.startsWith("data:"))
              ?.replace(/^data:\s*/, "");

            if (!dataLine || dataLine === "[DONE]") {
              return;
            }

            const json = safeJsonParse<GeminiStreamChunk | null>(dataLine, null);

            if (!json) {
              return;
            }

            const text = extractText(json);

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          });
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    captureServerError(error, { route: "coach", uid: session.uid });
    return new Response(
      "Fallback coach: You do not need another comforting explanation. Pick the most overdue task, cut it into 25 minutes, and finish it now.",
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
}
