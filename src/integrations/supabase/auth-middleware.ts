// SPA stub — server-side middleware not available in client build
// The original used createMiddleware / getRequest from @tanstack/react-start (server-only).
// In the SPA build all authentication is handled client-side via Supabase Auth.
export const requireSupabaseAuth = {} as any;
