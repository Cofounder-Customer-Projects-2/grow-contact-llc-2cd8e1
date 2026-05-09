import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Resend inbound email webhook payload (simplified)
interface ResendInboundPayload {
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  messageId?: string;
  inReplyTo?: string;
  // Resend may also send these at top level
  message_id?: string;
  in_reply_to?: string;
}

function parseAddress(raw: string): { email: string; name: string | null } {
  // Handles "Name <email>" or plain "email"
  const match = raw.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim() || null, email: match[2].trim() };
  }
  return { name: null, email: raw.trim() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[inbound] Missing Supabase env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const body = req.body as ResendInboundPayload;

  const fromRaw = body.from ?? "";
  const toRaw = Array.isArray(body.to) ? body.to[0] : (body.to ?? "");
  const subject = body.subject ?? "(no subject)";
  const messageId = body.messageId ?? body.message_id ?? body.headers?.["Message-ID"] ?? null;
  const inReplyTo = body.inReplyTo ?? body.in_reply_to ?? body.headers?.["In-Reply-To"] ?? null;

  const { name: fromName, email: fromEmail } = parseAddress(fromRaw);
  const { email: toEmail } = parseAddress(toRaw);

  // Try to match a candidate by from_email so we can link the thread
  let candidateId: string | null = null;
  if (fromEmail) {
    const { data: candidate } = await supabase
      .from("sourcing_candidates")
      .select("id")
      .eq("email", fromEmail)
      .maybeSingle();
    if (candidate) candidateId = candidate.id as string;
  }

  // Try to determine user_id from an outbound thread with matching thread_id/in_reply_to
  let userId: string | null = null;
  if (inReplyTo) {
    const { data: prev } = await supabase
      .from("email_threads")
      .select("user_id, thread_id")
      .eq("message_id", inReplyTo)
      .maybeSingle();
    if (prev) {
      userId = (prev as { user_id: string; thread_id: string | null }).user_id;
    }
  }

  const threadId = inReplyTo
    ? await resolveThreadId(supabase, inReplyTo, messageId)
    : messageId;

  const { error } = await supabase.from("email_threads").insert({
    user_id: userId,
    candidate_id: candidateId,
    subject,
    from_email: fromEmail,
    from_name: fromName,
    to_email: toEmail,
    body_text: body.text ?? null,
    body_html: body.html ?? null,
    message_id: messageId,
    in_reply_to: inReplyTo,
    thread_id: threadId,
    direction: "inbound",
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[inbound] DB insert error:", error.message);
    // Still return 200 to Resend so it doesn't retry indefinitely
    return res.status(200).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true });
}

async function resolveThreadId(
  supabase: ReturnType<typeof createClient>,
  inReplyTo: string,
  fallback: string | null
): Promise<string | null> {
  const { data } = await supabase
    .from("email_threads")
    .select("thread_id, message_id")
    .eq("message_id", inReplyTo)
    .maybeSingle();
  if (data) {
    const row = data as { thread_id: string | null; message_id: string | null };
    return row.thread_id ?? row.message_id ?? fallback;
  }
  return fallback;
}
