// Server-only postmark index — not available in SPA build.
export const getPostmarkClient = (): never => {
  throw new Error("postmark is not available in SPA mode");
};
