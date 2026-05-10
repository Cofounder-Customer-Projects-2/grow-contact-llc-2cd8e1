import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import {
  Users,
  MoreHorizontal,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";

export const Route = createFileRoute("/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CandidatesWrapper,
});

function CandidatesWrapper() {
  return (
    <ProtectedRoute>
      <CandidatesPage />
    </ProtectedRoute>
  );
}

type Stage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

type Candidate = {
  id: string;
  name: string;
  headline: string | null;
  location: string | null;
  profile_url: string;
  avatar_url: string | null;
  email: string | null;
  fit_score: number | null;
  pipeline_stage: Stage;
  created_at: string;
};

const STAGES: { value: Stage; label: string; color: string; dot: string }[] = [
  { value: "applied", label: "Applied", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  { value: "screening", label: "Screening", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  { value: "interview", label: "Interview", color: "bg-violet-500/10 text-violet-400 border-violet-500/20", dot: "bg-violet-400" },
  { value: "offer", label: "Offer", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
  { value: "hired", label: "Hired", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
];

function stageInfo(s: Stage) {
  return STAGES.find((x) => x.value === s) ?? STAGES[0];
}

function CandidatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["candidates-pipeline", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Candidate[]> => {
      const { data, error } = await supabase
        .from("sourcing_candidates")
        .select(
          "id, name, headline, location, profile_url, avatar_url, email, fit_score, pipeline_stage, created_at",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Candidate[];
    },
  });

  const stageMutation = useMutation({
    mutationFn: async ({
      id,
      stage,
    }: {
      id: string;
      stage: Stage;
    }) => {
      const { error } = await supabase
        .from("sourcing_candidates")
        .update({ pipeline_stage: stage })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates-pipeline"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byStage = (stage: Stage) =>
    (candidates ?? []).filter((c) => c.pipeline_stage === stage);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-6 pt-10">
          <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Candidates
          </div>
          <div className="flex items-end justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Pipeline
            </h1>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => setView("kanban")}
                  className={[
                    "rounded-md p-1.5 transition-colors",
                    view === "kanban"
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                  title="Kanban view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={[
                    "rounded-md p-1.5 transition-colors",
                    view === "list"
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="heroSecondary"
                size="sm"
                onClick={() => navigate({ to: "/sourcing" })}
              >
                Find candidates
              </Button>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Move candidates through your hiring pipeline.
          </p>
        </div>

        <div className="mx-auto max-w-[1400px] px-6 py-8">
          {isLoading ? (
            <KanbanSkeleton />
          ) : view === "kanban" ? (
            <KanbanBoard
              byStage={byStage}
              onMove={(id, stage) => stageMutation.mutate({ id, stage })}
            />
          ) : (
            <ListView
              candidates={candidates ?? []}
              onMove={(id, stage) => stageMutation.mutate({ id, stage })}
            />
          )}

          {!isLoading && (candidates ?? []).length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Users className="mb-4 h-10 w-10 text-muted-foreground/30" />
              <p className="text-base font-medium text-foreground">
                No candidates yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Source candidates and they'll appear here.
              </p>
              <Button
                variant="hero"
                size="sm"
                className="mt-5"
                onClick={() => navigate({ to: "/sourcing" })}
              >
                Start sourcing
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((s) => (
        <div
          key={s.value}
          className="w-[220px] flex-shrink-0 rounded-2xl border border-white/8 bg-card/30 p-3"
        >
          <Skeleton className="mb-3 h-5 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanBoard({
  byStage,
  onMove,
}: {
  byStage: (s: Stage) => Candidate[];
  onMove: (id: string, stage: Stage) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((col) => {
        const items = byStage(col.value);
        return (
          <div
            key={col.value}
            className="w-[220px] flex-shrink-0 rounded-2xl border border-white/8 bg-card/30"
          >
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.label}
                </span>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2 px-2 pb-3">
              {items.map((c) => (
                <KanbanCard key={c.id} candidate={c} onMove={onMove} />
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground/40">
                  Empty
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  candidate,
  onMove,
}: {
  candidate: Candidate;
  onMove: (id: string, stage: Stage) => void;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">
          {candidate.name}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex-shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {STAGES.filter((s) => s.value !== candidate.pipeline_stage).map(
              (s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => onMove(candidate.id, s.value)}
                >
                  Move to {s.label}
                </DropdownMenuItem>
              ),
            )}
            <DropdownMenuItem asChild>
              <a
                href={candidate.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View profile
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {candidate.headline && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {candidate.headline}
        </p>
      )}
      {candidate.fit_score != null && (
        <div className="mt-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {candidate.fit_score}% fit
          </span>
        </div>
      )}
    </div>
  );
}

function ListView({
  candidates,
  onMove,
}: {
  candidates: Candidate[];
  onMove: (id: string, stage: Stage) => void;
}) {
  return (
    <div className="space-y-2">
      {STAGES.map((col) => {
        const items = candidates.filter((c) => c.pipeline_stage === col.value);
        if (items.length === 0) return null;
        return (
          <div key={col.value}>
            <div className="flex items-center gap-2 py-2">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {col.label}
              </span>
              <span className="text-xs text-muted-foreground/60">
                {items.length}
              </span>
            </div>
            {items.map((c) => (
              <ListRow key={c.id} candidate={c} onMove={onMove} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ListRow({
  candidate,
  onMove,
}: {
  candidate: Candidate;
  onMove: (id: string, stage: Stage) => void;
}) {
  const info = stageInfo(candidate.pipeline_stage);
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-card/40 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{candidate.name}</p>
          {candidate.fit_score != null && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {candidate.fit_score}%
            </span>
          )}
        </div>
        {candidate.headline && (
          <p className="truncate text-xs text-muted-foreground">
            {candidate.headline}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Badge className={`text-xs ${info.color}`}>{info.label}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              Move <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {STAGES.filter((s) => s.value !== candidate.pipeline_stage).map(
              (s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => onMove(candidate.id, s.value)}
                >
                  {s.label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <a
          href={candidate.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
