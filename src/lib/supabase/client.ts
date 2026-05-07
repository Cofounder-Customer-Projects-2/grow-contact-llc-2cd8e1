// Thin re-export of the browser Supabase client for the SPA build.
// The @supabase/ssr server client is not available here.
export { supabase as createBrowserClient } from "@/integrations/supabase/client";
