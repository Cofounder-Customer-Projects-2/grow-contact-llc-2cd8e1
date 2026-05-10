import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Users,
  Mail,
  CalendarCheck,
  ArrowRight,
  Search,
  Inbox,
  Settings,
  Video,
  TrendingUp,
} from "lucide-react";

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

type DashStats = {
  candidatesSourced: number;
  outreachSent: number;
  interviewsScheduled: number;
};

type RecentActivity = {
  id: string;
  type: "candidate" | "outreach" | "interview";
  label: string;
  sub: string;
  ts: string;
};

function useDashboardStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-stats", userId],
    enabled: !!userId,
    queryFn: async (): Promise<DashStats> => {
      const [candidatesRes, outreachRes, interviewsRes] = await Promise.all([
        supabase
          .from("sourcing_candidates")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
        supabase
          .from("email_threads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!)
          .eq("direction", "outbound"),
        supabase
          .from("interview_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
      ]);
      return {
        candidatesSourced: candidatesRes.count ?? 0,
        outreachSent: outreachRes.count ?? 0,
        interviewsScheduled: interviewsRes.count ?? 0,
      };
    },
  });
}

function useRecentActivity(userId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-activity", userId],
    enabled: !!userId,
    queryFn: async (): Promise<RecentActivity[]> => {
      const [candidates, threads, interviews] = await Promise.all([
        supabase
          .from("sourcing_candidates")
          .select("id, name, headline, created_at")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("email_threads")
          .select("id, subject, to_email, sent_at")
          .eq("user_id", userId!)
          .eq("direction", "outbound")
          .order("sent_at", { ascending: false })
          .limit(3),
        supabase
          .from("interview_sessions")
          .select("id, candidate_name, role_title, created_at")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      const items: RecentActivity[] = [];
      for (const c of candidates.data ?? []) {
        items.push({
          id: c.id,
          type: "candidate",
          label: c.name,
          sub: c.headline ?? "Candidate sourced",
          ts: c.created_at,
        });
      }
      for (const t of threads.data ?? []) {
        items.push({
          id: t.id,
          type: "outreach",
          label: t.subject,
          sub: `To ${t.to_email}`,
          ts: t.sent_at,
        });
      }
      for (const i of interviews.data ?? []) {
        items.push({
          id: i.id,
          type: "interview",
          label: i.candidate_name,
          sub: i.role_title ?? "Interview",
          ts: i.created_at,
        });
      }
      return items
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 8);
    },
  });
}

function activityIcon(type: RecentActivity["type"]) {
  if (type === "candidate") return <Users className="h-4 w-4 text-violet-400" />;
  if (type === "outreach") return <Mail className="h-4 w-4 text-sky-400" />;
  return <Video className="h-4 w-4 text-emerald-400" />;
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card/40 p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
        {icon}
      </div>
      {loading ? (
        <Skeleton className="mb-1 h-8 w-16" />
      ) : (
        <p className="text-3xl font-semibold tabular-nums text-foreground">
          {value.toLocaleString()}
        </p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const { data: stats, isLoading: statsLoading } = useDashboardStats(user?.id);
  const { data: activity, isLoading: activityLoading } = useRecentActivity(user?.id);

  const quickActions = [
    { label: "Search candidates", icon: <Search className="h-4 w-4" />, to: "/sourcing" },
    { label: "View pipeline", icon: <TrendingUp className="h-4 w-4" />, to: "/candidates" },
    { label: "Outreach", icon: <Mail className="h-4 w-4" />, to: "/outreach" },
    { label: "Interview Copilot", icon: <Video className="h-4 w-4" />, to: "/interview" },
    { label: "Inbox", icon: <Inbox className="h-4 w-4" />, to: "/inbox" },
    { label: "Settings", icon: <Settings className="h-4 w-4" />, to: "/settings" },
  ] as const;

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Welcome back, {displayName}.
          </h1>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Users className="h-5 w-5 text-violet-400" />}
            label="Candidates sourced"
            value={stats?.candidatesSourced ?? 0}
            loading={statsLoading}
          />
          <StatCard
            icon={<Mail className="h-5 w-5 text-sky-400" />}
            label="Outreach sent"
            value={stats?.outreachSent ?? 0}
            loading={statsLoading}
          />
          <StatCard
            icon={<CalendarCheck className="h-5 w-5 text-emerald-400" />}
            label="Interviews"
            value={stats?.interviewsScheduled ?? 0}
            loading={statsLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick actions */}
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Quick actions
            </h2>
            <div className="rounded-2xl border border-white/8 bg-card/40 p-2">
              {quickActions.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <span className="flex items-center gap-3">
                    {a.icon}
                    {a.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Recent activity
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => navigate({ to: "/candidates" })}
              >
                View pipeline
              </Button>
            </div>
            <div className="rounded-2xl border border-white/8 bg-card/40">
              {activityLoading ? (
                <div className="divide-y divide-white/5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity?.length ? (
                <ul className="divide-y divide-white/5">
                  {activity.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
                        {activityIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.label}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.sub}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {relativeTime(item.ts)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No activity yet. Start by sourcing candidates.
                  </p>
                  <Button
                    variant="heroSecondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate({ to: "/sourcing" })}
                  >
                    Find candidates
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
