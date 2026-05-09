import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2, Users, Send, Video, Search, ArrowRight, Mail, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardWrapper,
});

function DashboardWrapper() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

type Stats = {
  searches: number;
  candidates: number;
  outreach: number;
  interviews: number;
};

type ActivityItem = {
  id: string;
  kind: "outreach" | "interview" | "candidate";
  label: string;
  sub: string;
  at: string;
};

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const uid = user!.id;
      const [
        { count: searches },
        { count: candidates },
        { count: outreach },
        { count: interviews },
        { data: recentSends },
        { data: recentSessions },
      ] = await Promise.all([
        supabase
          .from("sourcing_searches")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("sourcing_candidates")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("sourcing_sends")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("interview_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .is("deleted_at", null),
        supabase
          .from("sourcing_sends")
          .select("id, recipient_email, subject, sent_at, status")
          .eq("user_id", uid)
          .order("sent_at", { ascending: false })
          .limit(5),
        supabase
          .from("interview_sessions")
          .select("id, candidate_name, role_title, created_at, status")
          .eq("user_id", uid)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setStats({
        searches: searches ?? 0,
        candidates: candidates ?? 0,
        outreach: outreach ?? 0,
        interviews: interviews ?? 0,
      });

      const items: ActivityItem[] = [];
      for (const s of recentSends ?? []) {
        items.push({
          id: `send-${s.id}`,
          kind: "outreach",
          label: `Outreach to ${s.recipient_email}`,
          sub: s.subject,
          at: s.sent_at,
        });
      }
      for (const iv of recentSessions ?? []) {
        items.push({
          id: `iv-${iv.id}`,
          kind: "interview",
          label: `Interview: ${iv.candidate_name}`,
          sub: iv.role_title,
          at: iv.created_at,
        });
      }
      items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setActivity(items.slice(0, 8));
    } finally {
      setLoading(false);
    }
  }

  const statCards = stats
    ? [
        {
          label: "Candidates sourced",
          value: stats.candidates,
          icon: Users,
          to: "/candidates" as const,
        },
        {
          label: "Outreach sent",
          value: stats.outreach,
          icon: Send,
          to: "/outreach" as const,
        },
        {
          label: "Interviews scheduled",
          value: stats.interviews,
          icon: Video,
          to: "/interview" as const,
        },
        {
          label: "Saved searches",
          value: stats.searches,
          icon: Search,
          to: "/sourcing/searches" as const,
        },
      ]
    : [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-6 pt-10 pb-20">
          <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Welcome back, {displayName}.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Here's what's happening with your pipeline.
          </p>

          {/* Quick actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" onClick={() => navigate({ to: "/sourcing" })}>
              <Search className="mr-2 h-4 w-4" />
              New Search
            </Button>
            <Button variant="heroSecondary" onClick={() => navigate({ to: "/outreach" })}>
              <Mail className="mr-2 h-4 w-4" />
              New Outreach
            </Button>
            <Button variant="heroSecondary" onClick={() => navigate({ to: "/interview/new" as "/interview" })}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Interview
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-card/40 p-5 animate-pulse"
                  >
                    <div className="h-4 w-24 rounded bg-white/10 mb-3" />
                    <div className="h-8 w-12 rounded bg-white/10" />
                  </div>
                ))
              : statCards.map((s) => (
                  <Link
                    key={s.label}
                    to={s.to}
                    className="group rounded-2xl border border-white/10 bg-card/40 p-5 transition-colors hover:bg-card/60"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        {s.label}
                      </span>
                      <s.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-3xl font-semibold text-foreground">
                      {s.value.toLocaleString()}
                    </p>
                  </Link>
                ))}
          </div>

          {/* Activity feed */}
          <div className="mt-10">
            <h2 className="text-base font-semibold text-foreground mb-4">Recent activity</h2>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading…
              </div>
            ) : activity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-card/20 p-10 text-center text-sm text-muted-foreground">
                No activity yet. Run a{" "}
                <Link to="/sourcing" className="underline hover:text-foreground">
                  sourcing search
                </Link>{" "}
                to get started.
              </div>
            ) : (
              <div className="divide-y divide-white/5 rounded-2xl border border-white/10 overflow-hidden">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="shrink-0">
                      {item.kind === "outreach" ? (
                        <Send className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Video className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <Link
                    to="/inbox"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View inbox <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
