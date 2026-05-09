import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, Plus, X, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sendOutreach, listSequences } from "@/server/sourcing.functions";

export const Route = createFileRoute("/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OutreachPage,
});

type SendRow = {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string;
  error_message: string | null;
  sourcing_candidates: { id: string; name: string; profile_url: string } | null;
};

type Candidate = { id: string; name: string; email: string | null };
type Sequence = { id: string; name: string };

function OutreachPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sends, setSends] = useState<SendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

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
        .from("sourcing_sends")
        .select(
          "id, recipient_email, subject, body, status, sent_at, error_message, sourcing_candidates(id, name, profile_url)"
        )
        .eq("user_id", user!.id)
        .order("sent_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setSends((data ?? []) as unknown as SendRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load outreach");
    } finally {
      setLoading(false);
    }
  }

  function statusBadge(status: string) {
    if (status === "sent")
      return (
        <Badge variant="secondary" className="gap-1 text-green-400 border-green-400/20">
          <CheckCircle2 className="h-3 w-3" /> Sent
        </Badge>
      );
    if (status === "failed")
      return (
        <Badge variant="secondary" className="gap-1 text-red-400 border-red-400/20">
          <XCircle className="h-3 w-3" /> Failed
        </Badge>
      );
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" /> {status}
      </Badge>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-20">
        <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Outreach
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Outreach
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              All outreach emails sent to candidates.
            </p>
          </div>
          <Button variant="hero" onClick={() => setShowCompose(true)}>
            <Plus className="mr-2 h-4 w-4" /> Compose
          </Button>
        </div>

        {showCompose && (
          <ComposeModal
            userId={user?.id ?? ""}
            onClose={() => setShowCompose(false)}
            onSent={load}
          />
        )}

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : sends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-card/20 p-12 text-center text-sm text-muted-foreground">
              <Send className="mx-auto h-8 w-8 opacity-30 mb-3" />
              No outreach sent yet. Compose your first message or send from a sourcing search.
            </div>
          ) : (
            <div className="divide-y divide-white/5 rounded-2xl border border-white/10 overflow-hidden">
              {sends.map((s) => (
                <div key={s.id} className="px-5 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <Send className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {s.sourcing_candidates?.name ?? s.recipient_email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.recipient_email}
                        </span>
                        {statusBadge(s.status)}
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(s.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">
                        {s.subject}
                      </p>
                      {s.error_message && (
                        <p className="mt-1 text-xs text-red-400">{s.error_message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ComposeModal({
  userId,
  onClose,
  onSent,
}: {
  userId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [sequenceId, setSequenceId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase
        .from("sourcing_candidates")
        .select("id, name, email")
        .eq("user_id", userId)
        .order("name")
        .limit(200),
      listSequences(),
    ]).then(([{ data: cands }, seqs]) => {
      setCandidates((cands ?? []) as Candidate[]);
      setSequences(seqs as Sequence[]);
      if ((seqs as Sequence[])[0]) setSequenceId((seqs as Sequence[])[0].id);
    });
  }, [userId]);

  function onSelectCandidate(id: string) {
    setCandidateId(id);
    const c = candidates.find((x) => x.id === id);
    if (c?.email) setRecipientEmail(c.email);
  }

  async function send() {
    if (!candidateId || !sequenceId || !recipientEmail) {
      toast.error("Select a candidate, sequence, and provide a recipient email.");
      return;
    }
    setSending(true);
    try {
      await sendOutreach({
        data: {
          candidateId,
          sequenceId,
          recipientEmail,
          roleTitle: roleTitle || "the role",
        },
      });
      toast.success("Outreach queued");
      onClose();
      onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Compose outreach</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cand">Candidate</Label>
            <select
              id="cand"
              value={candidateId}
              onChange={(e) => onSelectCandidate(e.target.value)}
              className="mt-2 w-full rounded-md border border-white/10 bg-background px-2 py-2 text-sm"
            >
              <option value="">Select a candidate…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="seq">Sequence</Label>
            <select
              id="seq"
              value={sequenceId}
              onChange={(e) => setSequenceId(e.target.value)}
              className="mt-2 w-full rounded-md border border-white/10 bg-background px-2 py-2 text-sm"
            >
              <option value="">Select a sequence…</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {sequences.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                No sequences yet.{" "}
                <a href="/sourcing/sequences" className="underline">
                  Create one first
                </a>
                .
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Recipient email</Label>
            <Input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="mt-2"
              placeholder="candidate@example.com"
            />
          </div>
          <div>
            <Label htmlFor="role">Role title</Label>
            <Input
              id="role"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="mt-2"
              placeholder="Senior Engineer"
            />
          </div>
          <Button
            variant="hero"
            className="w-full"
            onClick={send}
            disabled={sending || !candidateId || !sequenceId || !recipientEmail}
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {sending ? "Sending…" : "Send outreach"}
          </Button>
        </div>
      </div>
    </div>
  );
}
