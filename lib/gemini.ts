import { getServerEnv } from "@/lib/env";
import { safeJsonParse, stripJsonFences } from "@/lib/utils";

interface GeminiTextPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiTextPart[];
  };
}

interface GeminiResponsePayload {
  candidates?: GeminiCandidate[];
}

export interface GeminiJsonResult<T> {
  data: T;
  raw: string;
  usedFallback: boolean;
  errorMessage?: string;
}

export const JSON_ONLY_SYSTEM_PROMPT =
  "Return ONLY valid JSON. No markdown, no explanation, no code blocks.";

function extractText(payload: GeminiResponsePayload): string {
  return (
    payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).find((part) => part.text)?.text ??
    ""
  );
}

export async function generateGeminiJson<T>(input: {
  prompt: string;
  fallback: T;
  temperature?: number;
}): Promise<GeminiJsonResult<T>> {
  const apiKey = getServerEnv().geminiApiKey;

  if (!apiKey) {
    return {
      data: input.fallback,
      raw: "",
      usedFallback: true,
      errorMessage: "Missing Gemini API key."
    };
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: JSON_ONLY_SYSTEM_PROMPT }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input.prompt }]
            }
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.6,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      return {
        data: input.fallback,
        raw: "",
        usedFallback: true,
        errorMessage: `Gemini request failed with ${response.status}`
      };
    }

    const payload = (await response.json()) as GeminiResponsePayload;
    const raw = stripJsonFences(extractText(payload));

    return {
      data: safeJsonParse(raw, input.fallback),
      raw,
      usedFallback: raw.length === 0
    };
  } catch (error) {
    return {
      data: input.fallback,
      raw: "",
      usedFallback: true,
      errorMessage: error instanceof Error ? error.message : "Unknown Gemini error"
    };
  }
}
