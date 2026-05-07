import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const CATEGORIES = ["Essay", "Benchmark", "Product", "Playbook"] as const;
type Cat = (typeof CATEGORIES)[number];

const THEMES = [
  "behaviorally-anchored interview rubrics",
  "reducing time-to-hire without lowering the bar",
  "calibrating hiring committees across distributed teams",
  "structured interviewing vs. unstructured pattern-matching",
  "retention-aware sourcing and what it changes",
  "designing technical loops that actually predict performance",
  "fairness audits in AI-assisted hiring",
  "panel debrief rituals that compress decision time",
  "comp transparency and offer-acceptance rates",
  "the economics of bad hires at Series B and beyond",
  "async screens vs. live screens — when each wins",
  "internal mobility as a hiring channel",
  "the dying art of the recruiter intake meeting",
  "scoring take-home exercises without bias drift",
  "sourcing in a thin market: signal over volume",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function pickTheme(recentTitles: string[]): string {
  const seen = new Set(recentTitles.map((t) => t.toLowerCase()));
  const fresh = THEMES.filter(
    (t) => !Array.from(seen).some((s) => s.includes(t.split(" ")[0]))
  );
  const pool = fresh.length ? fresh : THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.LOVABLE_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Server configuration error: missing Supabase credentials" });
  }
  if (!apiKey) {
    return res.status(501).json({ error: "AI generation is not configured (LOVABLE_API_KEY missing)" });
  }

  // Verify the caller is an authenticated admin user
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!anonKey) {
    return res.status(500).json({ error: "Server configuration error: missing anon key" });
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
  });

  const { data: { user }, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Check admin role
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: roleRow } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleRow) {
    return res.status(403).json({ error: "Admin access required" });
  }

  // Avoid topical repetition
  const { data: recent } = await adminClient
    .from("blog_posts")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(20);
  const recentTitles = (recent ?? []).map((r) => r.title as string);
  const theme = pickTheme(recentTitles);

  const system = `You are a senior editor at Grow, a talent operating system used by high-growth tech companies. You write the way a confident operator writes: declarative, specific, allergic to clichés. You never use words like "leverage", "synergy", "robust", "delve", or "in today's fast-paced world". You favor concrete numbers, named anti-patterns, and short paragraphs. Audience: heads of talent, founders, hiring managers at Series B–public companies.`;
  const user_msg = `Write a fresh blog post for the Grow blog about: "${theme}".\n\nConstraints:\n- 700–900 words, opinionated, evidence-flavored.\n- Use 2–4 "## " section headings (markdown style, just the line "## Heading").\n- Paragraphs separated by a blank line. Plain text, no images, no links.\n- Do NOT repeat any of these recent titles: ${recentTitles.slice(0, 12).join(" | ") || "(none)"}.\n- Pick the most natural category for the piece.\n\nReturn ONLY a JSON object via the tool call.`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user_msg },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "publish_post",
            description: "Return a complete, on-brand blog post draft.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Headline, sentence case, no clickbait, ≤80 chars." },
                excerpt: { type: "string", description: "1–2 sentences, ≤220 chars, no marketing speak." },
                category: { type: "string", enum: CATEGORIES as unknown as string[] },
                body: { type: "string", description: "Markdown-ish body as specified." },
                read_time: { type: "string", description: "e.g. '7 min read'" },
              },
              required: ["title", "excerpt", "category", "body", "read_time"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "publish_post" } },
    }),
  });

  if (!aiRes.ok) {
    const text = await aiRes.text();
    if (aiRes.status === 429) return res.status(429).json({ error: "AI rate limit — try again shortly" });
    if (aiRes.status === 402) return res.status(402).json({ error: "AI credits exhausted" });
    return res.status(500).json({ error: `AI gateway error ${aiRes.status}: ${text}` });
  }

  const aiJson = await aiRes.json() as any;
  const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return res.status(500).json({ error: "AI returned no tool call" });

  let draft: { title: string; excerpt: string; category: Cat; body: string; read_time: string };
  try {
    draft = JSON.parse(call.function.arguments);
  } catch {
    return res.status(500).json({ error: "AI returned malformed JSON" });
  }

  // Build unique slug
  let slug = slugify(draft.title);
  if (!slug) slug = `post-${Date.now()}`;
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const { data: existing } = await adminClient
      .from("blog_posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!existing) { slug = candidate; break; }
    suffix++;
    if (suffix > 20) { slug = `${slug}-${Date.now()}`; break; }
  }

  const { data: inserted, error: dbErr } = await adminClient
    .from("blog_posts")
    .insert({
      slug,
      title: draft.title.slice(0, 180),
      excerpt: draft.excerpt.slice(0, 280),
      category: draft.category,
      body: draft.body,
      read_time: draft.read_time || "6 min read",
      status: "draft",
    })
    .select("id, slug, title")
    .single();

  if (dbErr) return res.status(500).json({ error: `DB insert failed: ${dbErr.message}` });
  return res.status(200).json(inserted);
}
