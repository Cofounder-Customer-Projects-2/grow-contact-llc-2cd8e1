import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "grow_cookie_consent";

type ConsentValue = "accepted" | "declined";

function getStoredConsent(): ConsentValue | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "accepted" || value === "declined") return value;
  } catch {
    // localStorage unavailable (SSR, private mode, etc.)
  }
  return null;
}

function setStoredConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    setStoredConsent("accepted");
    setVisible(false);
  }

  function handleDecline() {
    setStoredConsent("declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-background/95 px-4 py-4 shadow-[0_-1px_24px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use strictly necessary cookies to keep you signed in and remember
          your preferences. We don't use advertising or tracking cookies.{" "}
          <Link
            to="/privacy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            className="text-muted-foreground"
          >
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
