import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[contact] Missing Supabase env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const body = req.body as Record<string, unknown>;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const company =
    typeof body?.company === "string" ? body.company.trim() : null;
  const team_size =
    typeof body?.team_size === "string" ? body.team_size.trim() : null;
  const user_agent =
    typeof body?.user_agent === "string" ? body.user_agent.trim() : null;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email and message are required" });
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    message,
    company: company || null,
    team_size: team_size || null,
    user_agent: user_agent || null,
  });

  if (error) {
    console.error("[contact] insert error", error);
    return res.status(500).json({ error: "Could not save submission" });
  }

  return res.status(200).json({ ok: true });
}
