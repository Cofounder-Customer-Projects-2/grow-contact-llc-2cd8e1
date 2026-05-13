import { supabase } from "@/integrations/supabase/client";

// ─── Public ─────────────────────────────────────────────────────────────────

export async function getPublishedPosts(): Promise<{
  posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readTime: string;
    author?: string;
    authorRole?: string;
    [key: string]: unknown;
  }>;
}> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug, title, excerpt, category, published_at, read_time, author, author_role"
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) throw error;

  type Row = { slug: string; title: string; excerpt: string | null; category: string | null; published_at: string | null; read_time: string | null; author: string | null; author_role: string | null };
  const posts = ((data ?? []) as Row[]).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    date: p.published_at
      ? new Date(p.published_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "",
    readTime: p.read_time,
    author: p.author,
    authorRole: p.author_role,
  }));

  return { posts };
}

export async function subscribeToNewsletter(opts: {
  data: { email: string; source: string };
}): Promise<void> {
  const { email, source } = opts.data;
  const { error } = await supabase.from("newsletter_subscribers").upsert(
    { email, source, status: "subscribed" },
    { onConflict: "email", ignoreDuplicates: false }
  );
  if (error) throw error;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function listAdminPosts(): Promise<{
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    status: "draft" | "published";
    published_at: string | null;
    created_at: string;
    read_time: string;
  }>;
}> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, category, status, published_at, created_at, read_time"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { posts: (data ?? []) as any };
}

export async function setPostStatus(opts: {
  data: { id: string; status: "draft" | "published" };
}): Promise<void> {
  const { id, status } = opts.data;
  const published_at = status === "published" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("blog_posts")
    .update({ status, published_at })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePost(opts: { data: { id: string } }): Promise<void> {
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", opts.data.id);
  if (error) throw error;
}

export async function generateDraftPost(): Promise<{
  id: string;
  title: string;
  slug: string;
}> {
  // Draft generation requires a server-side AI call.
  // Call the Vercel serverless function at /api/admin/generate-blog-draft
  // which has access to LOVABLE_API_KEY and the service role key.
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/admin/generate-blog-draft", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? "Draft generation failed");
  }
  return res.json();
}
