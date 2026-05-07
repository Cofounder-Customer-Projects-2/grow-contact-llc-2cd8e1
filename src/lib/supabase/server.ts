// Server-only Supabase client — not available in SPA build.
export const createServerClient = (): never => {
  throw new Error("createServerClient is not available in SPA mode");
};
