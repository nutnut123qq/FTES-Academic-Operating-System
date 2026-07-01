import type { GraphQLResponse } from "../../types"

/** Request for `syncPersonalProjectGithub`. */
export interface SyncPersonalProjectGithubRequest {
    /** Course ID. */
    courseId: string
    /** GitHub repository URL (omit when only syncing branch). */
    githubUrl?: string
    /** Git branch (omit when only syncing URL). */
    branch?: string
    /** GitHub access token for a PRIVATE repo (write-only; encrypted server-side, never returned). */
    githubToken?: string
    /** When true, removes the stored private-repo token (grading falls back to public). */
    clearGithubToken?: boolean
}

/** Apollo response shape for `syncPersonalProjectGithub` (no data payload). */
export interface MutateSyncPersonalProjectGithubResponse {
    /** Top-level `syncPersonalProjectGithub` field wrapping the standard API response. */
    syncPersonalProjectGithub: GraphQLResponse
}
