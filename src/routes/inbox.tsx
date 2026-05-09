import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InboxPage,
});

type EmailThread = {
  id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  body_text: string | null;
  direction: "inbound" | "outbound";
  sent_at: string;
  thread_id: string | null;
  sourcing_candidates: { id: string; name: string; profile_url: string } | null;
};

type Filter = "all" | "inbound" | "outbound";

function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmailThread | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  async function load() {
    setLoading(true);
    try {
      let q = supabase
        .from("email_threads")
        .select(
          "id, subject, from_email, from_name, to_email, body_text, direction, sent_at, thread_id, sourcing_candidates(id, name, profile_url)"
        )
        .order("sent_at", { ascending: false })
        .limit(200);

      if (filter !== "all") q = q.eq("direction", filter);

      const { data, error } = await q;
      if (error) throw error;
      setThreads((data ?? []) as unknown as EmailThread[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "inbound", label: "Received" },
    { id: "outbound", label: "Sent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Email
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Inbox
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Inbound replies and outbound outreach emails in one view.
        </p>

        {/* Filter tabs */}
        <nav className="mt-8 flex gap-1 border-b border-white/10">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => { setFilter(f.id); setSelected(null); }}
              className={[
                "rounded-t-md px-4 py-2 text-sm transition-colors hover:bg-white/5 hover:text-foreground",
                filter === f.id
                  ? "border-b-2 border-primary bg-white/5 text-foreground"
                  : "text-muted-foreground",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 flex gap-4">
          {/* Thread list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading…
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Mail className="h-10 w-10 opacity-30" />
                <p className="text-sm">No emails yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 rounded-lg border border-white/10 overflow-hidden">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t)}
                    className={[
                      "w-full text-left px-4 py-3 transition-colors hover:bg-white/5 flex items-start gap-3",
                      selected?.id === t.id ? "bg-white/5" : "",
                    ].join(" ")}
                  >
                    <div className="mt-0.5 shrink-0">
                      {t.direction === "inbound" ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {t.direction === "inbound"
                            ? t.from_name || t.from_email
                            : t.to_email}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(t.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {t.subject}
                      </p>
                      {t.body_text && (
                        <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                          {t.body_text.slice(0, 120)}
                        </p>
                      )}
                      {t.sourcing_candidates && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {t.sourcing_candidates.name}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-96 shrink-0 rounded-lg border border-white/10 p-5 bg-white/[0.02] self-start sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                {selected.direction === "inbound" ? (
                  <ArrowDownLeft className="h-4 w-4 text-green-400" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {selected.direction === "inbound" ? "Received" : "Sent"}
                </span>
              </div>
              <h2 className="text-base font-semibold text-foreground mb-3 leading-snug">
                {selected.subject}
              </h2>
              <dl className="text-xs text-muted-foreground space-y-1.5 mb-4">
                <div className="flex gap-2">
                  <dt className="w-10 shrink-0">From</dt>
                  <dd className="truncate text-foreground/80">
                    {selected.from_name
                      ? `${selected.from_name} <${selected.from_email}>`
                      : selected.from_email}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-10 shrink-0">To</dt>
                  <dd className="truncate text-foreground/80">{selected.to_email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-10 shrink-0">Date</dt>
                  <dd className="text-foreground/80">
                    {new Date(selected.sent_at).toLocaleString()}
                  </dd>
                </div>
                {selected.sourcing_candidates && (
                  <div className="flex gap-2">
                    <dt className="w-10 shrink-0">Who</dt>
                    <dd className="text-foreground/80">
                      <a
                        href={selected.sourcing_candidates.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-dashed hover:no-underline"
                      >
                        {selected.sourcing_candidates.name}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {selected.body_text && (
                <div className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed border-t border-white/10 pt-4">
                  {selected.body_text}
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
