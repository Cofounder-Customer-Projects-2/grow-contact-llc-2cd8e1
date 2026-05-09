import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const FROM_EMAIL = "outreach@mail.grow.contact";
const FROM_DOMAIN = "mail.grow.contact";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("[send-outreach] Missing Supabase env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify the caller's JWT
  let userId: string;
  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    userId = user.id;
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── Payload ───────────────────────────────────────────────────────────────────
  const body = req.body as {
    candidateId?: string;
    sequenceId?: string | null;
    subject?: string;
    body?: string;
    recipientEmail?: string;
    roleTitle?: string | null;
  };

  const { candidateId, sequenceId, subject, body: emailBody, recipientEmail, roleTitle } = body;

  if (!recipientEmail) {
    return res.status(400).json({ error: "recipientEmail is required" });
  }

  // Resolve subject + body from sequence if not provided directly
  let resolvedSubject = subject ?? "(no subject)";
  let resolvedBody = emailBody ?? "";
  let senderName = "Grow Recruiting";

  if (sequenceId) {
    const { data: seq } = await supabase
      .from("sourcing_sequences")
      .select("subject, body, sender_name")
      .eq("id", sequenceId)
      .single();
    if (seq) {
      const s = seq as { subject: string; body: string; sender_name: string | null };
      resolvedSubject = subject ?? s.subject;
      resolvedBody = emailBody ?? s.body;
      senderName = s.sender_name ?? senderName;
    }
  }

  // Look up candidate name for personalisation
  let candidateName = "";
  if (candidateId) {
    const { data: cand } = await supabase
      .from("sourcing_candidates")
      .select("name")
      .eq("id", candidateId)
      .maybeSingle();
    if (cand) candidateName = (cand as { name: string }).name ?? "";
  }

  // Basic token substitution
  const personalise = (s: string) =>
    s
      .replace(/\{\{candidate_name\}\}/gi, candidateName || "there")
      .replace(/\{\{role_title\}\}/gi, roleTitle ?? "this role");

  resolvedSubject = personalise(resolvedSubject);
  resolvedBody = personalise(resolvedBody);

  // ── Resend ────────────────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[send-outreach] Missing RESEND_API_KEY");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const resend = new Resend(resendKey);

  let resendMessageId: string | null = null;
  let sendStatus: "sent" | "failed" = "sent";
  let sendError: string | null = null;

  try {
    const { data: sent, error: resendError } = await resend.emails.send({
      from: `${senderName} <${FROM_EMAIL}>`,
      to: [recipientEmail],
      subject: resolvedSubject,
      text: resolvedBody,
      replyTo: FROM_EMAIL,
      headers: {
        "X-Entity-Ref-ID": candidateId ?? userId,
      },
    });

    if (resendError) throw new Error(resendError.message);
    resendMessageId = sent?.id ? `<${sent.id}@${FROM_DOMAIN}>` : null;
  } catch (err) {
    sendStatus = "failed";
    sendError = err instanceof Error ? err.message : String(err);
    console.error("[send-outreach] Resend error:", sendError);
  }

  // ── Insert into email_threads ─────────────────────────────────────────────────
  const { error: dbError } = await supabase.from("email_threads").insert({
    user_id: userId,
    candidate_id: candidateId ?? null,
    subject: resolvedSubject,
    from_email: FROM_EMAIL,
    from_name: senderName,
    to_email: recipientEmail,
    body_text: resolvedBody,
    message_id: resendMessageId,
    thread_id: resendMessageId,
    direction: "outbound",
    sent_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error("[send-outreach] DB insert error:", dbError.message);
  }

  // ── Record in sourcing_sends ──────────────────────────────────────────────────
  // sourcing_sends requires candidate_id, recipient_email, subject, body
  if (candidateId) {
    await supabase.from("sourcing_sends").insert({
      user_id: userId,
      candidate_id: candidateId,
      sequence_id: sequenceId ?? null,
      recipient_email: recipientEmail,
      subject: resolvedSubject,
      body: resolvedBody,
      status: sendStatus,
      error_message: sendError,
      sent_at: new Date().toISOString(),
    });
  }

  if (sendStatus === "failed") {
    return res.status(502).json({ error: sendError ?? "Email delivery failed" });
  }

  return res.status(200).json({ ok: true, messageId: resendMessageId });
}
