// Server-only postmark send — not available in SPA build.
export const sendEmail = (): never => {
  throw new Error("postmark send is not available in SPA mode");
};
export const sendTemplatedEmail = (..._args: unknown[]): never => {
  throw new Error("postmark sendTemplatedEmail is not available in SPA mode");
};
