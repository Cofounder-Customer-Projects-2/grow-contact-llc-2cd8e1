// SPA stubs — server functions are not available in the client build.

const notAvailable = (): never => {
  throw new Error("Server function not available in SPA mode");
};

export const startInterview = async (..._args: unknown[]): Promise<any> => notAvailable();
export const endInterview = async (..._args: unknown[]): Promise<any> => notAvailable();
export const finalizeScorecard = async (..._args: unknown[]): Promise<any> => notAvailable();
export const generateLiveSuggestionsFn = async (..._args: unknown[]): Promise<any> => notAvailable();
export const upsertRubric = async (..._args: unknown[]): Promise<any> => notAvailable();
export const deleteRubric = async (..._args: unknown[]): Promise<any> => notAvailable();
export const setSessionShare = async (..._args: unknown[]): Promise<any> => notAvailable();
export const addManualTranscript = async (..._args: unknown[]): Promise<any> => notAvailable();
export const addBulkTranscript = async (..._args: unknown[]): Promise<any> => notAvailable();
export const deleteSession = async (..._args: unknown[]): Promise<any> => notAvailable();
export const restoreSession = async (..._args: unknown[]): Promise<any> => notAvailable();
export const setSessionArchived = async (..._args: unknown[]): Promise<any> => notAvailable();
export const listSessions = async (..._args: unknown[]): Promise<any> => notAvailable();
export const updateScorecard = async (..._args: unknown[]): Promise<any> => notAvailable();
export const setSessionShareV2 = async (..._args: unknown[]): Promise<any> => notAvailable();
export const seedRubricTemplates = async (..._args: unknown[]): Promise<any> => notAvailable();
