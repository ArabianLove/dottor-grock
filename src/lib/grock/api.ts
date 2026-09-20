import { createServerFn } from "@tanstack/react-start";
import { buildSystemPrompt } from "./prompt";
import type { ClinicalNote, Likelihood } from "./types";

export type HistoryTurn = { role: "user" | "assistant"; text: string };

export type ConsultRequest = {
  specialtyId: string | null;
  history: HistoryTurn[];
  userText: string;
  images: string[];
};

export type ConsultSuccess = {
  ok: true;
  message: string;
  clinical: ClinicalNote;
};

export type ConsultFailure = {
  ok: false;
  error: string;
};

export type ConsultResponse = ConsultSuccess | ConsultFailure;

const LIKELIHOODS: Likelihood[] = ["alta", "media", "bassa"];

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown): boolean {
  return v === true;
}

function parseClinical(raw: unknown, fallbackMessage: string): { message: string; clinical: ClinicalNote } {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const message = asString(obj.message, fallbackMessage).trim() || fallbackMessage;

  const asksRaw = obj.asksForMedia;
  let asksForMedia: ClinicalNote["asksForMedia"] = null;
  if (asksRaw && typeof asksRaw === "object") {
    const a = asksRaw as Record<string, unknown>;
    asksForMedia = {
      photos: asBool(a.photos),
      video: asBool(a.video),
      reason: asString(a.reason, "Mi serve vedere il segno."),
    };
    if (!asksForMedia.photos && !asksForMedia.video) asksForMedia = null;
  }

  const differential = Array.isArray(obj.differential)
    ? obj.differential
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const d = item as Record<string, unknown>;
          const name = asString(d.name).trim();
          if (!name) return null;
          const likelihood = LIKELIHOODS.includes(d.likelihood as Likelihood)
            ? (d.likelihood as Likelihood)
            : "media";
          return { name, likelihood, rationale: asString(d.rationale) };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .slice(0, 6)
    : [];

  const list = (v: unknown) =>
    Array.isArray(v)
      ? v.map((x) => asString(x).trim()).filter(Boolean).slice(0, 8)
      : [];

  return {
    message,
    clinical: {
      emergency: asBool(obj.emergency),
      emergencyAction: asString(obj.emergencyAction) || null,
      specialtyFocus: asString(obj.specialtyFocus) || "Quadro clinico",
      asksForMedia,
      differential,
      redFlags: list(obj.redFlags),
      questions: list(obj.questions),
      nextSteps: list(obj.nextSteps),
      conscience: asString(obj.conscience),
    },
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Risposta non strutturata");
  }
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "high" } };

type ChatMessagePayload = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

export const runConsult = createServerFn({ method: "POST" })
  .validator((input: ConsultRequest) => {
    const userText = (input.userText ?? "").slice(0, 4000);
    const history = (input.history ?? []).slice(-10).map((t) => ({
      role: t.role,
      text: (t.text ?? "").slice(0, 4000),
    }));
    const images = (input.images ?? [])
      .filter((url) => typeof url === "string" && url.startsWith("data:image/"))
      .slice(0, 4)
      .map((url) => url.slice(0, 450_000));
    return {
      specialtyId: input.specialtyId ?? null,
      history,
      userText,
      images,
    };
  })
  .handler(async ({ data }): Promise<ConsultResponse> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "Lo studio non è collegato in questo ambiente. Riprova più tardi.",
      };
    }

    const userContent: string | ContentPart[] =
      data.images.length === 0
        ? data.userText
        : [
            {
              type: "text",
              text:
                data.userText +
                `\n\n[Allegate ${data.images.length} immagini cliniche, in ordine.]`,
            },
            ...data.images.map((url) => ({
              type: "image_url" as const,
              image_url: { url, detail: "high" as const },
            })),
          ];

    const messages: ChatMessagePayload[] = [
      { role: "system", content: buildSystemPrompt(data.specialtyId) },
      ...data.history.map((t) => ({
        role: t.role,
        content: t.text,
      })),
      { role: "user", content: userContent },
    ];

    const call = async () =>
      fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          messages,
          temperature: 0.35,
          max_tokens: 2400,
          response_format: { type: "json_object" },
        }),
      });

    let res = await call();
    if (!res.ok && res.status >= 500) {
      res = await call();
    }
    if (!res.ok) {
      return { ok: false, error: `Lo studio non risponde (${res.status}). Riprova tra un momento.` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      return { ok: false, error: "Il Dottor Grock non ha lasciato nota. Riprova." };
    }

    try {
      const parsed = extractJson(text);
      const { message, clinical } = parseClinical(parsed, text);
      return { ok: true, message, clinical };
    } catch {
      return {
        ok: true,
        message: text,
        clinical: {
          emergency: false,
          emergencyAction: null,
          specialtyFocus: "",
          asksForMedia: null,
          differential: [],
          redFlags: [],
          questions: [],
          nextSteps: [],
          conscience: "",
        },
      };
    }
  });
