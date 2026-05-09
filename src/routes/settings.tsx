import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Bell, Loader2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Grow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

type Tab = "profile" | "password" | "notifications";

function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-20">
        <div className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Settings
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Settings
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Manage your profile and account preferences.
        </p>

        <nav className="mt-8 flex gap-1 border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                "flex items-center gap-2 rounded-t-md px-4 py-2 text-sm transition-colors hover:bg-white/5 hover:text-foreground",
                tab === t.id
                  ? "border-b-2 border-primary bg-white/5 text-foreground"
                  : "text-muted-foreground",
              ].join(" ")}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {authLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : tab === "profile" ? (
            <ProfileTab user={user} />
          ) : tab === "password" ? (
            <PasswordTab />
          ) : (
            <NotificationsTab userId={user?.id ?? ""} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ProfileTab({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, company")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setName(data?.name ?? "");
        setCompany(data?.company ?? "");
        setLoading(false);
      });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim().slice(0, 100), company: company.trim().slice(0, 200) })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );

  return (
    <div className="max-w-lg">
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Profile information</h2>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              placeholder="Ada Lovelace"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-2"
              placeholder="Acme Inc."
              maxLength={200}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="mt-2 opacity-60 cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Email cannot be changed here. Contact support if you need to update it.
            </p>
          </div>
          <div className="pt-1">
            <Button type="submit" variant="hero" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordTab() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendReset() {
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (!email) {
      toast.error("No authenticated session found");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset email sent");
    }
  }

  return (
    <div className="max-w-lg">
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6">
        <h2 className="text-sm font-semibold text-foreground mb-2">Change password</h2>
        <p className="text-sm text-muted-foreground mb-5">
          We'll send a password reset link to your email address.
        </p>
        {sent ? (
          <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-foreground">
            Check your inbox for a reset link. The link expires in 1 hour.
          </p>
        ) : (
          <Button variant="hero" onClick={sendReset} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {sending ? "Sending…" : "Send reset link"}
          </Button>
        )}
        <div className="mt-4">
          <Link
            to="/reset-password"
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Already have a reset token? Go directly to reset password →
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ userId }: { userId: string }) {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("sourcing_searches")
      .select("alert_enabled")
      .eq("user_id", userId)
      .eq("alert_enabled", true)
      .limit(1)
      .then(({ data }) => {
        setAlertEnabled((data?.length ?? 0) > 0);
        setLoading(false);
      });
  }, [userId]);

  async function toggleAlerts() {
    setSaving(true);
    const newValue = !alertEnabled;
    const { error } = await supabase
      .from("sourcing_searches")
      .update({ alert_enabled: newValue })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      setAlertEnabled(newValue);
      toast.success(newValue ? "Alerts enabled for all searches" : "Alerts disabled for all searches");
    }
  }

  return (
    <div className="max-w-lg">
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Notification preferences</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <p className="text-sm font-medium text-foreground">Sourcing search alerts</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get emailed when saved searches find new candidates.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAlerts}
                disabled={saving}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  alertEnabled ? "bg-primary" : "bg-white/10",
                  saving ? "opacity-50 cursor-wait" : "",
                ].join(" ")}
                role="switch"
                aria-checked={alertEnabled}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    alertEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              To configure alerts per search, visit{" "}
              <Link to="/sourcing/searches" className="underline hover:text-foreground">
                Saved Searches
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
