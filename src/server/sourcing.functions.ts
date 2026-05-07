import { supabase } from "@/integrations/supabase/client";

type Opts<D> = { data: D; headers?: Record<string, string> | undefined };

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(j.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Searches ─────────────────────────────────────────────────────────────────

export async function listSourcingSearches(): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("sourcing_searches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteSourcingSearch(opts: Opts<{ searchId: string }>): Promise<void> {
  const { error } = await supabase
    .from("sourcing_searches")
    .delete()
    .eq("id", opts.data.searchId);
  if (error) throw error;
}

export async function toggleSearchAlert(opts: Opts<{ searchId: string; enabled: boolean }>): Promise<void> {
  const { error } = await supabase
    .from("sourcing_searches")
    .update({ alert_enabled: opts.data.enabled })
    .eq("id", opts.data.searchId);
  if (error) throw error;
}

// runSourcingSearch requires server-side AI / external APIs — proxy to Vercel
export async function runSourcingSearch(opts: Opts<{
  query: string;
  roleTitle?: string | null;
  source?: string;
  searchId?: string;
  saveAs?: string | null;
  filters?: Record<string, unknown>;
}>): Promise<{ candidates: unknown[] }> {
  return apiPost<{ candidates: unknown[] }>("/api/sourcing/run-search", opts.data);
}

// ─── Candidates ───────────────────────────────────────────────────────────────

// enrichCandidate / findCandidateEmail / fetchCandidateCompany require external APIs
export async function enrichCandidate(opts: Opts<{ candidateId: string }>): Promise<{ ok: boolean; email?: string | null; signals?: Record<string, unknown> }> {
  return apiPost<{ ok: boolean; email?: string | null; signals?: Record<string, unknown> }>("/api/sourcing/enrich-candidate", opts.data);
}

export async function findCandidateEmail(opts: Opts<{ candidateId: string }>): Promise<{ email: string | null }> {
  return apiPost<{ email: string | null }>("/api/sourcing/find-email", opts.data);
}

export async function fetchCandidateCompany(opts: Opts<{ candidateId: string }>): Promise<unknown> {
  return apiPost<unknown>("/api/sourcing/fetch-company", opts.data);
}

// ─── Shortlists ───────────────────────────────────────────────────────────────

export async function listShortlists(): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("sourcing_shortlists")
    .select("*, sourcing_shortlist_members(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getShortlist(opts: Opts<{ shortlistId: string }>): Promise<unknown> {
  const { data, error } = await supabase
    .from("sourcing_shortlists")
    .select(`
      *,
      sourcing_shortlist_members(
        *,
        sourcing_candidates(*)
      )
    `)
    .eq("id", opts.data.shortlistId)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertShortlist(opts: Opts<{
  id?: string;
  name: string;
  description?: string | null;
  role_title?: string | null;
  roleTitle?: string | null;
}>): Promise<{ id: string; shortlist: unknown }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { id, roleTitle, ...fields } = opts.data;
  const dbFields = { ...fields, role_title: roleTitle ?? fields.role_title ?? null };

  if (id) {
    const { data, error } = await supabase
      .from("sourcing_shortlists")
      .update(dbFields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { id: (data as { id: string }).id, shortlist: data };
  } else {
    const { data, error } = await supabase
      .from("sourcing_shortlists")
      .insert({ ...dbFields, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return { id: (data as { id: string }).id, shortlist: data };
  }
}

export async function deleteShortlist(opts: Opts<{ shortlistId: string }>): Promise<void> {
  const { error } = await supabase
    .from("sourcing_shortlists")
    .delete()
    .eq("id", opts.data.shortlistId);
  if (error) throw error;
}

export async function addToShortlist(opts: Opts<{
  shortlistId: string;
  candidateId: string;
  stage?: string;
  notes?: string | null;
}>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { shortlistId, candidateId, stage = "new", notes } = opts.data;
  const { error } = await supabase
    .from("sourcing_shortlist_members")
    .insert({
      shortlist_id: shortlistId,
      candidate_id: candidateId,
      stage,
      notes: notes ?? null,
      user_id: user.id,
    });
  if (error) throw error;
}

export async function updateShortlistMember(opts: Opts<{
  memberId: string;
  stage?: string;
  notes?: string | null;
}>): Promise<void> {
  const { memberId, ...fields } = opts.data;
  const { error } = await supabase
    .from("sourcing_shortlist_members")
    .update(fields)
    .eq("id", memberId);
  if (error) throw error;
}

export async function removeFromShortlist(opts: Opts<{ memberId: string }>): Promise<void> {
  const { error } = await supabase
    .from("sourcing_shortlist_members")
    .delete()
    .eq("id", opts.data.memberId);
  if (error) throw error;
}

// ─── Sequences ────────────────────────────────────────────────────────────────

export async function listSequences(): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("sourcing_sequences")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertSequence(opts: Opts<{
  id?: string;
  name: string;
  subject: string;
  body: string;
  sender_name?: string | null;
  senderName?: string | null;
}>): Promise<{ sequence: unknown }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { id, senderName, sender_name, ...rest } = opts.data;
  const resolved_sender = senderName ?? sender_name ?? null;

  if (id) {
    const { data, error } = await supabase
      .from("sourcing_sequences")
      .update({ ...rest, sender_name: resolved_sender, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { sequence: data };
  } else {
    const { data, error } = await supabase
      .from("sourcing_sequences")
      .insert({ ...rest, sender_name: resolved_sender, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return { sequence: data };
  }
}

export async function deleteSequence(opts: Opts<{ sequenceId: string }>): Promise<void> {
  const { error } = await supabase
    .from("sourcing_sequences")
    .delete()
    .eq("id", opts.data.sequenceId);
  if (error) throw error;
}

// ─── Outreach ─────────────────────────────────────────────────────────────────

// sendOutreach requires server-side email sending — proxy to Vercel
export async function sendOutreach(opts: Opts<{
  candidateId: string;
  sequenceId?: string | null;
  subject?: string;
  body?: string;
  recipientEmail: string;
  roleTitle?: string | null;
}>): Promise<void> {
  await apiPost<void>("/api/sourcing/send-outreach", opts.data);
}

export async function listOutreachSends(opts: {
  data?: { status?: string; limit?: number };
} = {}): Promise<unknown[]> {
  const { status, limit = 100 } = opts.data ?? {};

  let query = supabase
    .from("sourcing_sends")
    .select(`
      *,
      sourcing_candidates(id, name, profile_url, avatar_url),
      sourcing_sequences(id, name)
    `)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function outreachStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  suppressed: number;
  last7: number;
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [all, last7] = await Promise.all([
    supabase.from("sourcing_sends").select("status"),
    supabase
      .from("sourcing_sends")
      .select("id", { count: "exact", head: true })
      .gte("sent_at", sevenDaysAgo),
  ]);

  if (all.error) throw all.error;
  if (last7.error) throw last7.error;

  const rows = all.data ?? [];
  return {
    total: rows.length,
    sent: rows.filter((r) => r.status === "sent").length,
    failed: rows.filter((r) => r.status === "failed").length,
    suppressed: rows.filter((r) => r.status === "suppressed").length,
    last7: last7.count ?? 0,
  };
}
