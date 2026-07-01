import type { GraphQLResponse } from "../../types"

/** Variables for the `userPinnedProjects` query. */
export interface QueryUserPinnedProjectsRequest {
    /** Id of the user whose pinned projects to fetch. */
    userId: string
}

/**
 * Pin kind discriminator. Mirrors the backend `ProjectPinType` enum:
 * - `course` — a pin linked to one of the user's enrollment capstones (may be
 *   "Verified by FTES AOS"); title/url are derived server-side.
 * - `external` — a free-form, user-authored project (never verified).
 */
export type QueryPinnedProjectType = "course" | "external"

/**
 * One project pinned to a user's public profile (a `userPinnedProjects` item).
 * Mirrors the backend `UserPinnedProjectItemData`; every display field is
 * nullable because course pins resolve their title/url server-side.
 */
export interface QueryUserPinnedProjectItem {
    /** Pin primary-key id (uuid) — pass to unpin/reorder. */
    id: string
    /** Pin kind discriminator (course | external). */
    type: QueryPinnedProjectType
    /** Resolved display title (course title fallback for course pins), or null. */
    title: string | null
    /** Free-form description shown under the pin, or null. */
    description: string | null
    /** Project URL (external link / capstone repo), or null. */
    url: string | null
    /** Technology stack tags displayed on the pin, or null. */
    techStack: Array<string> | null
    /** Display order within the user's pinned list (ascending). */
    orderIndex: number
    /** True only for a course pin with a completed capstone ("Verified by FTES AOS"). */
    isVerified: boolean
}

/** Apollo response shape for the `userPinnedProjects` query. */
export interface QueryUserPinnedProjectsResponse {
    /** Top-level `userPinnedProjects` field wrapping the standard API response. */
    userPinnedProjects: GraphQLResponse<Array<QueryUserPinnedProjectItem>>
}
