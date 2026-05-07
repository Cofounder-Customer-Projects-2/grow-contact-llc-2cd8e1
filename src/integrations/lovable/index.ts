// Lovable-specific auth integration removed (not available in SPA build).
// Stub exported so any existing imports still resolve at compile time.

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      _provider: "google" | "apple" | "microsoft" | "lovable",
      _opts?: SignInOptions
    ): Promise<{ error?: Error; redirected?: boolean }> => {
      console.warn("lovable.auth.signInWithOAuth is not available in SPA mode");
      return { error: new Error("Not available in SPA mode") };
    },
  },
};
