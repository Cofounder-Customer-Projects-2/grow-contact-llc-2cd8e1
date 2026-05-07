import { supabase } from "@/integrations/supabase/client";

// Shared helper: the headers parameter is accepted for API signature
// compatibility but the Supabase JS client manages the auth session itself.
type Opts<D> = { data: D; headers?: Record<string, string> | undefined };

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function listSessions(opts: {
  data: {
    page?: number;
    pageSize?: number;
    scope?: "active" | "archived" | "trash";
    q?: string;
  };
  headers?: Record<string, string> | undefined;
}): Promise<{ rows: unknown[]; total: number }> {
  const { page = 0, pageSize = 20, scope = "active", q } = opts.data;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("interview_sessions")
    .select(
      "id, candidate_name, role_title, meeting_platform, status, created_at, archived, deleted_at",
      { count: "exact" }
    );

  if (scope === "active") {
    query = query.is("deleted_at", null).eq("archived", false);
  } else if (scope === "archived") {
    query = query.is("deleted_at", null).eq("archived", true);
  } else if (scope === "trash") {
    query = query.not("deleted_at", "is", null);
  }

  if (q) {
    query = query.or(
      `candidate_name.ilike.%${q}%,role_title.ilike.%${q}%`
    );
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function startInterview(opts: Opts<{
  candidateName: string;
  roleTitle: string;
  meetingUrl: string;
  meetingPlatform?: string;
  jobDescription?: string | null;
  rubricId?: string | null;
}>): Promise<{ session: unknown; sessionId: string; botDispatched: boolean; error?: string }> {
  const {
    candidateName,
    roleTitle,
    meetingUrl,
    meetingPlatform,
    jobDescription,
    rubricId,
  } = opts.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const platform = meetingPlatform ??
    (meetingUrl.includes("zoom.us") ? "zoom" :
     meetingUrl.includes("meet.google") ? "google_meet" :
     meetingUrl.includes("teams.microsoft") ? "microsoft_teams" : "unknown");

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      candidate_name: candidateName,
      role_title: roleTitle,
      meeting_url: meetingUrl,
      meeting_platform: platform,
      job_description: jobDescription ?? null,
      rubric_id: rubricId ?? null,
      user_id: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  // botDispatched is always false in SPA mode — Recall.ai bot dispatch is server-only
  return { session: data, sessionId: (data as { id: string }).id, botDispatched: false, error: "Recall.ai bot not configured" };
}

export async function endInterview(opts: Opts<{ sessionId: string }>): Promise<void> {
  const { error } = await supabase
    .from("interview_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", opts.data.sessionId);
  if (error) throw error;
}

export async function deleteSession(opts: Opts<{ sessionId: string }>): Promise<void> {
  const { error } = await supabase
    .from("interview_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", opts.data.sessionId);
  if (error) throw error;
}

export async function restoreSession(opts: Opts<{ sessionId: string }>): Promise<void> {
  const { error } = await supabase
    .from("interview_sessions")
    .update({ deleted_at: null })
    .eq("id", opts.data.sessionId);
  if (error) throw error;
}

export async function setSessionArchived(opts: Opts<{
  sessionId: string;
  archived: boolean;
}>): Promise<void> {
  const { error } = await supabase
    .from("interview_sessions")
    .update({ archived: opts.data.archived })
    .eq("id", opts.data.sessionId);
  if (error) throw error;
}

export async function setSessionShare(opts: Opts<{
  sessionId: string;
  expiresInDays?: number;
}>): Promise<{ shareToken: string; expiresAt: string }> {
  const expiresAt = new Date(
    Date.now() + (opts.data.expiresInDays ?? 7) * 24 * 3600 * 1000
  ).toISOString();
  const shareToken = crypto.randomUUID();

  const { error } = await supabase
    .from("interview_sessions")
    .update({ share_token: shareToken, share_expires_at: expiresAt })
    .eq("id", opts.data.sessionId);
  if (error) throw error;

  return { shareToken, expiresAt };
}

export async function setSessionShareV2(opts: Opts<{
  sessionId: string;
  enabled: boolean;
  expiresInDays?: number;
}>): Promise<{ token: string | null; shareToken: string | null; expiresAt: string | null }> {
  if (!opts.data.enabled) {
    const { error } = await supabase
      .from("interview_sessions")
      .update({ share_token: null, share_expires_at: null })
      .eq("id", opts.data.sessionId);
    if (error) throw error;
    return { token: null, shareToken: null, expiresAt: null };
  }
  const r = await setSessionShare({ data: { sessionId: opts.data.sessionId, expiresInDays: opts.data.expiresInDays }, headers: opts.headers });
  return { token: r.shareToken, shareToken: r.shareToken, expiresAt: r.expiresAt };
}

// ─── Transcript ────────────────────────────────────────────────────────────────

export async function addManualTranscript(opts: Opts<{
  sessionId: string;
  speaker: string;
  content: string;
  kind?: string;
}>): Promise<void> {
  const { sessionId, speaker, content, kind = "transcript" } = opts.data;
  const { error } = await supabase.from("interview_events").insert({
    session_id: sessionId,
    speaker,
    content,
    kind,
  });
  if (error) throw error;
}

export async function addBulkTranscript(opts: Opts<{
  sessionId: string;
  text?: string;
  lines?: Array<{ speaker: string; content: string; kind?: string }>;
}>): Promise<{ count: number }> {
  const { sessionId, text, lines: rawLines } = opts.data;

  let lines: Array<{ speaker: string; content: string; kind?: string }> = rawLines ?? [];
  if (text) {
    // Parse "Speaker: text" line format
    lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const idx = l.indexOf(":");
        if (idx > 0 && idx < 30) {
          return { speaker: l.slice(0, idx).trim(), content: l.slice(idx + 1).trim() };
        }
        return { speaker: "Speaker", content: l };
      });
  }

  if (lines.length === 0) return { count: 0 };

  const rows = lines.map((l) => ({
    session_id: sessionId,
    speaker: l.speaker,
    content: l.content,
    kind: l.kind ?? "transcript",
  }));
  const { error } = await supabase.from("interview_events").insert(rows);
  if (error) throw error;
  return { count: rows.length };
}

// ─── Scorecards ────────────────────────────────────────────────────────────────

type ScorecardUpsert = {
  session_id: string;
  summary: string;
  overall_rating?: number | null;
  recommendation?: string | null;
  strengths?: import("@/integrations/supabase/types").Json;
  concerns?: import("@/integrations/supabase/types").Json;
  follow_ups?: import("@/integrations/supabase/types").Json;
  competencies?: import("@/integrations/supabase/types").Json;
};

export async function finalizeScorecard(opts: Opts<{
  sessionId: string;
  summary?: string;
  overall_rating?: number;
  recommendation?: string;
  strengths?: unknown[];
  concerns?: unknown[];
  follow_ups?: unknown[];
  competencies?: unknown[];
}>): Promise<{ scorecard: unknown }> {
  const { sessionId, ...rest } = opts.data;
  const upsertData: ScorecardUpsert = {
    session_id: sessionId,
    summary: rest.summary ?? "",
    overall_rating: rest.overall_rating ?? null,
    recommendation: rest.recommendation ?? null,
    strengths: (rest.strengths ?? []) as import("@/integrations/supabase/types").Json,
    concerns: (rest.concerns ?? []) as import("@/integrations/supabase/types").Json,
    follow_ups: (rest.follow_ups ?? []) as import("@/integrations/supabase/types").Json,
    competencies: (rest.competencies ?? []) as import("@/integrations/supabase/types").Json,
  };
  const { data, error } = await supabase.from("interview_scorecards").upsert(
    upsertData,
    { onConflict: "session_id" }
  ).select().single();
  if (error) throw error;
  return { scorecard: data };
}

export async function updateScorecard(opts: Opts<{
  sessionId: string;
  summary?: string;
  overall_rating?: number | null;
  recommendation?: string | null;
  strengths?: unknown[];
  concerns?: unknown[];
  follow_ups?: unknown[];
  competencies?: unknown[];
}>): Promise<void> {
  const { sessionId, strengths, concerns, follow_ups, competencies, ...scalar } = opts.data;
  const patch: Record<string, unknown> = { ...scalar };
  if (strengths !== undefined) patch.strengths = strengths as import("@/integrations/supabase/types").Json;
  if (concerns !== undefined) patch.concerns = concerns as import("@/integrations/supabase/types").Json;
  if (follow_ups !== undefined) patch.follow_ups = follow_ups as import("@/integrations/supabase/types").Json;
  if (competencies !== undefined) patch.competencies = competencies as import("@/integrations/supabase/types").Json;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("interview_scorecards")
    .update(patch as any)
    .eq("session_id", sessionId);
  if (error) throw error;
}

// ─── Live suggestions ─────────────────────────────────────────────────────────

export async function generateLiveSuggestionsFn(opts: Opts<{
  sessionId: string;
  context?: string;
}>): Promise<{ suggestion: string }> {
  // Requires server-side AI; proxy to a Vercel function if available
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/interview/live-suggestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(opts.data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? "Failed to generate suggestions");
  }
  return res.json();
}

// ─── Rubrics ──────────────────────────────────────────────────────────────────

export async function upsertRubric(opts: Opts<{
  id?: string;
  name: string;
  roleTitle?: string | null;
  role_title?: string | null;
  focus?: string | null;
  competencies?: unknown;
  isDefault?: boolean;
  is_default?: boolean;
}>): Promise<{ rubric: unknown }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { id, roleTitle, isDefault, competencies, ...rest } = opts.data;
  const dbFields = {
    ...rest,
    role_title: roleTitle ?? rest.role_title ?? null,
    is_default: isDefault ?? rest.is_default ?? false,
    competencies: (competencies ?? []) as import("@/integrations/supabase/types").Json,
  };

  if (id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("interview_rubrics")
      .update(dbFields as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { rubric: data };
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("interview_rubrics")
      .insert({ ...dbFields, user_id: user.id } as any)
      .select()
      .single();
    if (error) throw error;
    return { rubric: data };
  }
}

export async function deleteRubric(opts: Opts<{ id: string }>): Promise<void> {
  const { error } = await supabase
    .from("interview_rubrics")
    .delete()
    .eq("id", opts.data.id);
  if (error) throw error;
}

export async function seedRubricTemplates(opts: Opts<{ templates?: string[] }>): Promise<{ count: number }> {
  // In SPA mode we don't have access to template JSON files server-side.
  // Return a helpful message so callers can surface it.
  console.info("[seedRubricTemplates] Template seeding requires a server-side migration. 0 templates added.");
  return { count: 0 };
}
