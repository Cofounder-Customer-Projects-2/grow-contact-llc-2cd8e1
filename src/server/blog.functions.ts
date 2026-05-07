// SPA stubs — server functions are not available in the client build.
// All server-side logic runs via Supabase directly from the client or Vercel functions.

const notAvailable = (): never => {
  throw new Error("Server function not available in SPA mode");
};

export const generateDraftPost = async (..._args: unknown[]): Promise<any> => notAvailable();
export const listAdminPosts = async (..._args: unknown[]): Promise<any> => notAvailable();
export const setPostStatus = async (..._args: unknown[]): Promise<any> => notAvailable();
export const deletePost = async (..._args: unknown[]): Promise<any> => notAvailable();
export const getPublishedPosts = async (..._args: unknown[]): Promise<{ posts: Array<{ slug: string; title: string; excerpt: string; category: string; date: string; readTime: string; author?: string; authorRole?: string; [key: string]: unknown }> }> => ({ posts: [] });
export const subscribeToNewsletter = async (..._args: unknown[]): Promise<any> => notAvailable();
