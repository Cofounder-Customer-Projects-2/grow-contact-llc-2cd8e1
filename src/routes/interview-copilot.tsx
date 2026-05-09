import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect the public marketing URL to the authenticated app hub.
export const Route = createFileRoute("/interview-copilot")({
  beforeLoad: () => {
    throw redirect({ to: "/interview" });
  },
  component: () => null,
});
