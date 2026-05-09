import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { generateLiveSuggestions } from "../../src/server/interview-ai.server";

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
    console.error("[live-suggestions] Missing Supabase env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId: string;
  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized" });
    userId = user.id;
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── Payload ─────────────────────────────────────────────────────────────────
  const { sessionId, context } = req.body as {
    sessionId?: string;
    context?: string;
  };

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  // ── Fetch session ────────────────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("id, user_id, candidate_name, role_title, job_description, rubric_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const s = session as {
    id: string;
    user_id: string;
    candidate_name: string;
    role_title: string;
    job_description: string | null;
    rubric_id: string | null;
    status: string;
  };

  if (s.user_id !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ── Fetch recent transcript events ───────────────────────────────────────────
  const { data: events } = await supabase
    .from("interview_events")
    .select("speaker, content, kind, created_at")
    .eq("session_id", sessionId)
    .eq("kind", "transcript")
    .order("created_at", { ascending: true })
    .limit(200);

  const transcriptLines = (
    (events ?? []) as Array<{ speaker: string | null; content: string }>
  )
    .map((e) => `${e.speaker ?? "Speaker"}: ${e.content}`)
    .join("\n");

  // Also append any manual context passed by the client
  const transcriptSoFar = context
    ? `${transcriptLines}\n${context}`
    : transcriptLines;

  if (!transcriptSoFar.trim()) {
    // Nothing to analyze yet — return empty gracefully
    return res.status(200).json({ suggestion: "Waiting for transcript…" });
  }

  // ── Fetch rubric if any ──────────────────────────────────────────────────────
  let rubric: { name: string; focus: string | null; competencies: string[] } | null = null;
  if (s.rubric_id) {
    const { data: rubricRow } = await supabase
      .from("interview_rubrics")
      .select("name, focus, competencies")
      .eq("id", s.rubric_id)
      .maybeSingle();

    if (rubricRow) {
      const r = rubricRow as {
        name: string;
        focus: string | null;
        competencies: unknown;
      };
      rubric = {
        name: r.name,
        focus: r.focus,
        competencies: Array.isArray(r.competencies)
          ? (r.competencies as unknown[]).map((c) => String(c))
          : [],
      };
    }
  }

  // ── Call AI ──────────────────────────────────────────────────────────────────
  let result;
  try {
    result = await generateLiveSuggestions({
      roleTitle: s.role_title,
      jobDescription: s.job_description,
      candidateName: s.candidate_name,
      transcriptSoFar,
      rubric,
    });
  } catch (err) {
    console.error("[live-suggestions] AI error:", err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : "AI request failed",
    });
  }

  // ── Persist suggestions + red flags as interview_events ─────────────────────
  const now = new Date().toISOString();
  const insertRows: Array<{
    session_id: string;
    kind: string;
    speaker: null;
    content: string;
    metadata: { generated_at: string };
  }> = [];

  for (const q of result.follow_ups) {
    insertRows.push({
      session_id: sessionId,
      kind: "suggestion",
      speaker: null,
      content: q,
      metadata: { generated_at: now },
    });
  }
  for (const s of result.signals) {
    insertRows.push({
      session_id: sessionId,
      kind: "suggestion",
      speaker: null,
      content: `Signal: ${s}`,
      metadata: { generated_at: now },
    });
  }
  for (const f of result.red_flags) {
    insertRows.push({
      session_id: sessionId,
      kind: "red_flag",
      speaker: null,
      content: f,
      metadata: { generated_at: now },
    });
  }

  if (insertRows.length > 0) {
    await supabase.from("interview_events").insert(insertRows);
  }

  const firstSuggestion =
    result.follow_ups[0] ??
    result.signals[0] ??
    "No new suggestions at this point.";

  return res.status(200).json({ suggestion: firstSuggestion, ...result });
}
