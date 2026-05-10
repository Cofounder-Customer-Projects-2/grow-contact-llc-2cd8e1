import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { Mail, Plus, Send, Inbox, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export const Route = createFileRoute("/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OutreachWrapper,
});

function OutreachWrapper() {
  return (
    <ProtectedRoute>
      <OutreachPage />
    </ProtectedRoute>
  );
}

type Thread = {
  id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  body_text: string | null;
  direction: string;
  sent_at: string;
  candidate_id: string | null;
};

type Filter = "all" | "sent" | "received";

function directionBadge(direction: string) {
  if (direction === "outbound") {
    return (
      <Badge className="gap-1 bg-sky-500/10 text-sky-400 border-sky-500/20">
        <Send className="h-3 w-3" />
        Sent
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
      <Inbox className="h-3 w-3" />
      Reply
    </Badge>
  );
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function OutreachPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selected, setSelected] = useState<Thread | null>(null);

  const { data: threads, isLoading } = useQuery({
    queryKey: ["outreach-threads", user?.id, filter],
    enabled: !!user,
    queryFn: async (): Promise<Thread[]> => {
      let q = supabase
        .from("email_threads")
        .select(
          "id, subject, from_email, from_name, to_email, body_text, direction, sent_at, candidate_id",
        )
        .eq("user_id", user!.id)
        .order("sent_at", { ascending: false })
        .limit(50);
      if (filter === "sent") q = q.eq("direction", "outbound");
      if (filter === "received") q = q.eq("direction", "inbound");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Thread[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (form: {
      toEmail: string;
      subject: string;
      body: string;
    }) => {
      const { error } = await supabase.from("email_threads").insert({
        user_id: user!.id,
        to_email: form.toEmail.trim(),
        from_email: user!.email ?? "",
        from_name: (user?.user_metadata?.name as string | undefined) ?? null,
        subject: form.subject.trim(),
        body_text: form.body.trim(),
        direction: "outbound",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message saved");
      setComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["outreach-threads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tabs: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Sent", value: "sent" },
    { label: "Received", value: "received" },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-6 pt-10">
          <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Outreach
          </div>
          <div className="flex items-end justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Email threads
            </h1>
            <Button
              variant="hero"
              size="sm"
              className="mb-1 gap-2"
              onClick={() => setComposeOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Compose
            </Button>
          </div>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Track sent outreach and replies from candidates in one place.
          </p>
          <nav className="mt-8 flex gap-1 border-b border-white/10">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFilter(t.value)}
                className={[
                  "rounded-t-md px-4 py-2 text-sm transition-colors hover:bg-white/5",
                  filter === t.value
                    ? "border-b-2 border-primary bg-white/5 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-white/8 bg-card/40 p-5"
                >
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : threads?.length ? (
            <div className="space-y-2">
              {threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-card/40 p-5 text-left transition-colors hover:bg-white/5"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
                    {t.direction === "outbound" ? (
                      <ArrowUpRight className="h-4 w-4 text-sky-400" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {t.subject}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.direction === "outbound"
                        ? `To: ${t.to_email}`
                        : `From: ${t.from_name ?? t.from_email}`}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    {directionBadge(t.direction)}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(t.sent_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Mail className="mb-4 h-10 w-10 text-muted-foreground/30" />
              <p className="text-base font-medium text-foreground">
                No outreach yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Compose a message or send outreach from the sourcing page.
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => setComposeOpen(true)}
                >
                  Compose
                </Button>
                <Button
                  variant="heroSecondary"
                  size="sm"
                  onClick={() => navigate({ to: "/sourcing" })}
                >
                  Find candidates
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Compose dialog */}
      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSend={(form) => sendMutation.mutate(form)}
        loading={sendMutation.isPending}
      />

      {/* Thread detail dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {selected.subject}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex gap-6 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">From: </span>
                  {selected.from_name
                    ? `${selected.from_name} <${selected.from_email}>`
                    : selected.from_email}
                </span>
                <span>
                  <span className="font-medium text-foreground">To: </span>
                  {selected.to_email}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                <p className="whitespace-pre-wrap text-sm text-foreground/80">
                  {selected.body_text ?? "(No body)"}
                </p>
              </div>
              <p className="text-right text-xs text-muted-foreground">
                {formatDate(selected.sent_at)}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
  onSend,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSend: (form: { toEmail: string; subject: string; body: string }) => void;
  loading: boolean;
}) {
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function handleSend() {
    if (!toEmail.trim() || !subject.trim() || !body.trim()) {
      toast.error("Fill in all fields.");
      return;
    }
    onSend({ toEmail, subject, body });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">New message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="compose-to" className="text-foreground">
              To
            </Label>
            <Input
              id="compose-to"
              type="email"
              placeholder="candidate@example.com"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="compose-subject" className="text-foreground">
              Subject
            </Label>
            <Input
              id="compose-subject"
              placeholder="Exciting opportunity at…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="compose-body" className="text-foreground">
              Message
            </Label>
            <Textarea
              id="compose-body"
              placeholder="Hi [Name],…"
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSend} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
