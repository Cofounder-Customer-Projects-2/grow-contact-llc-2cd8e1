// SPA stubs — server functions are not available in the client build.

const notAvailable = (): never => {
  throw new Error("Server function not available in SPA mode");
};

export const runSourcingSearch = async (..._args: unknown[]): Promise<any> => notAvailable();
export const enrichCandidate = async (..._args: unknown[]): Promise<any> => notAvailable();
export const findCandidateEmail = async (..._args: unknown[]): Promise<any> => notAvailable();
export const fetchCandidateCompany = async (..._args: unknown[]): Promise<any> => notAvailable();
export const listSourcingSearches = async (..._args: unknown[]): Promise<any> => notAvailable();
export const toggleSearchAlert = async (..._args: unknown[]): Promise<any> => notAvailable();
export const deleteSourcingSearch = async (..._args: unknown[]): Promise<any> => notAvailable();
export const upsertShortlist = async (..._args: unknown[]): Promise<any> => notAvailable();
export const listShortlists = async (..._args: unknown[]): Promise<any> => notAvailable();
export const deleteShortlist = async (..._args: unknown[]): Promise<any> => notAvailable();
export const addToShortlist = async (..._args: unknown[]): Promise<any> => notAvailable();
export const updateShortlistMember = async (..._args: unknown[]): Promise<any> => notAvailable();
export const removeFromShortlist = async (..._args: unknown[]): Promise<any> => notAvailable();
export const getShortlist = async (..._args: unknown[]): Promise<any> => notAvailable();
export const upsertSequence = async (..._args: unknown[]): Promise<any> => notAvailable();
export const listSequences = async (..._args: unknown[]): Promise<any> => notAvailable();
export const deleteSequence = async (..._args: unknown[]): Promise<any> => notAvailable();
export const sendOutreach = async (..._args: unknown[]): Promise<any> => notAvailable();
export const listOutreachSends = async (..._args: unknown[]): Promise<any> => notAvailable();
export const outreachStats = async (..._args: unknown[]): Promise<any> => notAvailable();
