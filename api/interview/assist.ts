import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ── AI provider: prefers OPEN_ROUTER env var (OpenRouter), falls back to
//    LOVABLE_API_KEY (Lovable AI Gateway) so both environments are supported.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

function getAIConfig(): { url: string; key: string } {
  const orKey = process.env.OPEN_ROUTER;
  if (orKey) return { url: OPENROUTER_URL, key: orKey };
  const lovKey = process.env.LOVABLE_API_KEY;
  if (lovKey) return { url: LOVABLE_URL, key: lovKey };
  throw new Error("No AI provider configured — set OPEN_ROUTER or LOVABLE_API_KEY");
}

interface AssistRequest {
  notes: string;
  rubric?: {
    name?: string;
    focus?: string | null;
    competencies?: string[];
  } | null;
  candidate?: {
    name?: string;
    role?: string;
    jobDescription?: string | null;
  } | null;
}

interface AssistResponse {
  suggestions: string[];
  signals: string[];
  nextQuestions: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized" });
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── Payload ─────────────────────────────────────────────────────────────────
  const body = req.body as AssistRequest;
  const { notes, rubric, candidate } = body;

  if (!notes || notes.trim().length < 10) {
    return res.status(400).json({ error: "notes is required (min 10 chars)" });
  }

  // ── Build prompt ─────────────────────────────────────────────────────────────
  const sys = `You are an expert interview copilot. Given recruiter notes from a live interview, surface:
- 2-4 sharp follow-up questions to probe deeper
- 0-3 key signals (positive observations worth noting)
- 0-3 next questions the recruiter should ask
Be concise, specific to the role, and never invent facts.`;

  const candidatePart = candidate
    ? `CANDIDATE: ${candidate.name ?? "Unknown"}
ROLE: ${candidate.role ?? "Unknown"}
JOB DESCRIPTION: ${candidate.jobDescription ?? "(none)"}`
    : "";

  const rubricPart = rubric
    ? `RUBRIC: ${rubric.name ?? "Custom"}
FOCUS: ${rubric.focus ?? "(none)"}
COMPETENCIES: ${(rubric.competencies ?? []).join(", ")}`
    : "";

  const user = `${candidatePart}
${rubricPart}

RECRUITER NOTES:
${notes.slice(0, 8000)}

Return your output via the assist_interview tool.`;

  // ── Call AI ──────────────────────────────────────────────────────────────────
  let aiConfig: { url: string; key: string };
  try {
    aiConfig = getAIConfig();
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }

  const aiBody = {
    model: MODEL,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "assist_interview",
          description: "Return structured interview assistance",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: { type: "string" },
                maxItems: 3,
                description: "Key positive signals or observations",
              },
              signals: {
                type: "array",
                items: { type: "string" },
                maxItems: 3,
                description: "Red flags or concerns surfaced so far",
              },
              nextQuestions: {
                type: "array",
                items: { type: "string" },
                maxItems: 4,
                description: "Sharp follow-up questions to ask next",
              },
            },
            required: ["suggestions", "signals", "nextQuestions"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "assist_interview" } },
  };

  let parsed: AssistResponse;
  try {
    const aiRes = await fetch(aiConfig.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiConfig.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      throw new Error(`AI request failed [${aiRes.status}]: ${text}`);
    }

    const data = await aiRes.json() as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{
            function?: { arguments?: string };
          }>;
        };
      }>;
    };

    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      parsed = { suggestions: [], signals: [], nextQuestions: [] };
    } else {
      const raw = JSON.parse(args) as Partial<AssistResponse>;
      parsed = {
        suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
        signals: Array.isArray(raw.signals) ? raw.signals : [],
        nextQuestions: Array.isArray(raw.nextQuestions) ? raw.nextQuestions : [],
      };
    }
  } catch (err) {
    console.error("[assist] AI error:", err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : "AI request failed",
    });
  }

  return res.status(200).json(parsed);
}
