import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { generateScorecard } from "../../src/server/interview-ai.server";

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
    console.error("[finalize] Missing Supabase env vars");
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
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  // ── Fetch session ────────────────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("id, user_id, candidate_name, role_title, job_description, rubric_id")
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
  };

  if (s.user_id !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ── Fetch full transcript ────────────────────────────────────────────────────
  const { data: events } = await supabase
    .from("interview_events")
    .select("speaker, content, kind, created_at")
    .eq("session_id", sessionId)
    .in("kind", ["transcript"])
    .order("created_at", { ascending: true });

  const transcript = (
    (events ?? []) as Array<{ speaker: string | null; content: string }>
  )
    .map((e) => `${e.speaker ?? "Speaker"}: ${e.content}`)
    .join("\n");

  if (!transcript.trim()) {
    return res.status(422).json({
      error: "No transcript found. Add transcript lines before generating a scorecard.",
    });
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

  // ── Generate scorecard via AI ────────────────────────────────────────────────
  let aiCard;
  try {
    aiCard = await generateScorecard({
      roleTitle: s.role_title,
      jobDescription: s.job_description,
      candidateName: s.candidate_name,
      transcript,
      rubric,
    });
  } catch (err) {
    console.error("[finalize] AI error:", err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : "AI scorecard generation failed",
    });
  }

  // ── Upsert scorecard to DB ───────────────────────────────────────────────────
  const upsertData = {
    session_id: sessionId,
    summary: aiCard.summary,
    overall_rating: aiCard.overall_rating,
    recommendation: aiCard.recommendation,
    strengths: aiCard.strengths,
    concerns: aiCard.concerns,
    competencies: aiCard.competencies,
    follow_ups: aiCard.follow_ups,
  };

  const { data: scorecard, error: upsertError } = await supabase
    .from("interview_scorecards")
    .upsert(upsertData, { onConflict: "session_id" })
    .select()
    .single();

  if (upsertError) {
    console.error("[finalize] DB upsert error:", upsertError.message);
    return res.status(500).json({ error: "Failed to save scorecard" });
  }

  // ── Also mark session as completed ──────────────────────────────────────────
  await supabase
    .from("interview_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "pending"); // Only update if still pending (don't overwrite a real end)

  return res.status(200).json({ scorecard });
}
