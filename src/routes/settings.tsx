import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { User, Key, Bell, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsWrapper,
});

function SettingsWrapper() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function SettingsPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<SectionId>("profile");

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 pt-10">
          <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Settings
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Account &amp; preferences
          </h1>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:gap-10">
            {/* Sidebar nav */}
            <nav className="flex shrink-0 flex-row gap-1 md:w-44 md:flex-col">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActive(s.id)}
                    className={[
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      active === s.id
                        ? "bg-white/8 text-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {active === "profile" && <ProfileSection userId={user?.id} />}
              {active === "api-keys" && <ApiKeysSection />}
              {active === "notifications" && <NotificationsSection userId={user?.id} />}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card/40 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function ProfileSection({ userId }: { userId: string | undefined }) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, company")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? { name: "", company: "" };
    },
  });

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [seeded, setSeeded] = useState(false);

  if (!seeded && profile) {
    setName(profile.name ?? "");
    setCompany(profile.company ?? "");
    setSeeded(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim().slice(0, 100),
          company: company.trim().slice(0, 200),
        })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
      queryClient.invalidateQueries({ queryKey: ["nav-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SectionCard
      title="Profile"
      description="Update your display name and company."
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="settings-name" className="text-foreground">
              Full name
            </Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="settings-company" className="text-foreground">
              Company
            </Label>
            <Input
              id="settings-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company"
              className="mt-1"
            />
          </div>
          <Button
            variant="hero"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

function ApiKeysSection() {
  const [showRecall, setShowRecall] = useState(false);
  const [recallKey, setRecallKey] = useState("");

  return (
    <div className="space-y-4">
      <SectionCard
        title="API Keys"
        description="Connect third-party services. Keys are stored securely and never exposed in the UI."
      >
        <div className="space-y-5">
          {/* RECALL AI */}
          <div>
            <Label htmlFor="recall-key" className="text-foreground">
              Recall AI key
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Required for Interview Copilot live transcription via Recall.ai.
              Obtain from{" "}
              <a
                href="https://recall.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                recall.ai
              </a>
              .
            </p>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="recall-key"
                  type={showRecall ? "text" : "password"}
                  value={recallKey}
                  onChange={(e) => setRecallKey(e.target.value)}
                  placeholder="Set via RECALL_API_KEY environment variable"
                  disabled
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRecall((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showRecall ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
              Configure <code className="font-mono">RECALL_API_KEY</code> as a
              Vercel environment variable to enable this integration.
            </p>
          </div>

          <Separator className="bg-white/8" />

          {/* OpenRouter */}
          <div>
            <Label className="text-foreground">OpenRouter key</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Powers AI candidate sourcing and ranking. Set via{" "}
              <code className="font-mono text-xs">OPEN_ROUTER</code> environment
              variable.
            </p>
            <p className="mt-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-xs text-muted-foreground">
              Configured server-side.{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                Manage on OpenRouter →
              </a>
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

type NotifPrefs = {
  new_reply: boolean;
  shortlist_alert: boolean;
  interview_reminder: boolean;
};

function NotificationsSection({ userId }: { userId: string | undefined }) {
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["settings-notifs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<NotifPrefs> => {
      const { data } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("user_id", userId!)
        .maybeSingle();
      const raw = (data as { notification_prefs?: unknown } | null)?.notification_prefs;
      const safe = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw as Partial<NotifPrefs> : {};
      return {
        new_reply: safe.new_reply ?? true,
        shortlist_alert: safe.shortlist_alert ?? true,
        interview_reminder: safe.interview_reminder ?? true,
      };
    },
  });

  const [localPrefs, setLocalPrefs] = useState<NotifPrefs | null>(null);

  const effective = localPrefs ?? prefs ?? null;

  const saveMutation = useMutation({
    mutationFn: async (p: NotifPrefs) => {
      if (!userId) return;
      const { error } = await supabase
        .from("profiles")
        .update({ notification_prefs: p as unknown as Json })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification preferences saved");
      queryClient.invalidateQueries({ queryKey: ["settings-notifs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggle(key: keyof NotifPrefs) {
    if (!effective) return;
    setLocalPrefs({ ...effective, [key]: !effective[key] });
  }

  const notifRows: { key: keyof NotifPrefs; label: string; description: string }[] = [
    {
      key: "new_reply",
      label: "Candidate replies",
      description: "Email me when a candidate replies to outreach.",
    },
    {
      key: "shortlist_alert",
      label: "Saved search alerts",
      description: "Notify me when new matches appear in saved searches.",
    },
    {
      key: "interview_reminder",
      label: "Interview reminders",
      description: "Remind me before a scheduled interview starts.",
    },
  ];

  return (
    <SectionCard
      title="Notifications"
      description="Choose what you want to be notified about."
    >
      {isLoading || !effective ? (
        <div className="space-y-4">
          {notifRows.map((r) => (
            <Skeleton key={r.key} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {notifRows.map((r) => (
            <div key={r.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
              <Switch
                checked={effective[r.key]}
                onCheckedChange={() => toggle(r.key)}
              />
            </div>
          ))}
          <div className="pt-2">
            <Button
              variant="hero"
              size="sm"
              onClick={() => effective && saveMutation.mutate(effective)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
