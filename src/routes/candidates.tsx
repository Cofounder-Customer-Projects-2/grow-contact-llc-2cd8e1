import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  Loader2,
  Search,
  ExternalLink,
  X,
  Mail,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CandidatesPage,
});

type Candidate = {
  id: string;
  name: string;
  headline: string | null;
  location: string | null;
  profile_url: string;
  avatar_url: string | null;
  email: string | null;
  ai_summary: string | null;
  fit_score: number | null;
  source: string;
  first_seen_at: string;
  signals: Record<string, unknown>;
};

type Send = {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  sent_at: string;
};

function CandidatesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [sends, setSends] = useState<Send[]>([]);
  const [sendsLoading, setSendsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sourcing_candidates")
        .select(
          "id, name, headline, location, profile_url, avatar_url, email, ai_summary, fit_score, source, first_seen_at, signals"
        )
        .eq("user_id", user!.id)
        .order("first_seen_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setCandidates((data ?? []) as unknown as Candidate[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  async function loadSends(candidateId: string) {
    setSendsLoading(true);
    try {
      const { data } = await supabase
        .from("sourcing_sends")
        .select("id, recipient_email, subject, status, sent_at")
        .eq("candidate_id", candidateId)
        .order("sent_at", { ascending: false });
      setSends((data ?? []) as Send[]);
    } finally {
      setSendsLoading(false);
    }
  }

  function selectCandidate(c: Candidate) {
    setSelected(c);
    setSends([]);
    loadSends(c.id);
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates;
    const q = query.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headline?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [candidates, query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-20">
        <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Candidates
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Candidates
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              All candidates sourced across your searches.
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, location, skill…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          {/* List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-card/20 p-12 text-center text-sm text-muted-foreground">
                <Users className="mx-auto h-8 w-8 opacity-30 mb-3" />
                {candidates.length === 0
                  ? "No candidates yet. Run a sourcing search to add some."
                  : "No candidates match your search."}
              </div>
            ) : (
              <div className="divide-y divide-white/5 rounded-2xl border border-white/10 overflow-hidden">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCandidate(c)}
                    className={[
                      "w-full text-left px-5 py-4 flex items-start gap-4 transition-colors hover:bg-white/5",
                      selected?.id === c.id ? "bg-white/5" : "",
                    ].join(" ")}
                  >
                    {c.avatar_url ? (
                      <img
                        src={c.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/20 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        {c.fit_score != null && (
                          <Badge variant="secondary" className="text-[10px]">
                            {c.fit_score} fit
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {c.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.headline ?? "(no headline)"}
                      </p>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        {c.location && <span>📍 {c.location}</span>}
                        {c.email && <span className="truncate">✉ {c.email}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile panel */}
          {selected && (
            <div className="w-80 shrink-0 self-start sticky top-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {selected.avatar_url ? (
                    <img
                      src={selected.avatar_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/20 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selected.name}
                    </p>
                    {selected.location && (
                      <p className="text-xs text-muted-foreground">📍 {selected.location}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selected.headline && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selected.headline}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {selected.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-foreground/80">{selected.email}</span>
                  </div>
                )}
                {selected.fit_score != null && (
                  <div className="flex gap-2">
                    <span>Fit score:</span>
                    <span className="text-foreground/80">{selected.fit_score}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span>Source:</span>
                  <span className="text-foreground/80">{selected.source}</span>
                </div>
                <div className="flex gap-2">
                  <span>Added:</span>
                  <span className="text-foreground/80">
                    {formatDistanceToNow(new Date(selected.first_seen_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {selected.ai_summary && (
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-foreground/90 leading-relaxed">
                  {selected.ai_summary}
                </div>
              )}

              <a
                href={selected.profile_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View profile
              </a>

              {/* Outreach history */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Outreach history
                </p>
                {sendsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : sends.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No outreach sent yet.</p>
                ) : (
                  <div className="space-y-2">
                    {sends.map((s) => (
                      <div key={s.id} className="text-xs">
                        <p className="text-foreground/80 truncate">{s.subject}</p>
                        <p className="text-muted-foreground">
                          {s.status} ·{" "}
                          {formatDistanceToNow(new Date(s.sent_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
