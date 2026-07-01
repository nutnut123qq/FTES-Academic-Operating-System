import type { GraphQLResponse } from "../../types"

/**
 * GraphQL `PinCourseProjectRequest` body — pin one of the caller's enrollment
 * capstones. Title and URL are derived server-side from the enrollment/course;
 * only the description and tech stack are user-supplied (both optional).
 */
export interface PinCourseProjectRequest {
    /** Id of the enrollment whose capstone to pin (must belong to the user). */
    enrollmentId: string
    /** Optional description shown under the pin. */
    description?: string
    /** Optional technology stack tags. */
    techStack?: Array<string>
}

/**
 * GraphQL `PinExternalProjectRequest` body — pin a free-form external project.
 * Unlike a course pin, every field is user-authored and the pin is never
 * verified.
 */
export interface PinExternalProjectRequest {
    /** Project title (required). */
    title: string
    /** Optional description shown under the pin. */
    description?: string
    /** Optional project URL. */
    url?: string
    /** Optional technology stack tags. */
    techStack?: Array<string>
}

/** GraphQL `UnpinProjectRequest` body — remove one of the caller's pins. */
export interface UnpinProjectRequest {
    /** Id of the pin to remove (must belong to the user). */
    id: string
}

/**
 * GraphQL `ReorderPinnedProjectsRequest` body — array position becomes the new
 * `orderIndex` (0-based). Ids not owned by the caller are ignored server-side.
 */
export interface ReorderPinnedProjectsRequest {
    /** Pin ids in the desired order. */
    ids: Array<string>
}

/** Apollo response shape for `pinCourseProject` (returns the new pin id). */
export interface MutatePinCourseProjectResponse {
    /** Top-level `pinCourseProject` field wrapping the standard API response. */
    pinCourseProject: GraphQLResponse<string>
}

/** Apollo response shape for `pinExternalProject` (returns the new pin id). */
export interface MutatePinExternalProjectResponse {
    /** Top-level `pinExternalProject` field wrapping the standard API response. */
    pinExternalProject: GraphQLResponse<string>
}

/** Apollo response shape for `unpinProject` (no data payload). */
export interface MutateUnpinProjectResponse {
    /** Top-level `unpinProject` field wrapping the standard API response. */
    unpinProject: GraphQLResponse
}

/** Apollo response shape for `reorderPinnedProjects` (no data payload). */
export interface MutateReorderPinnedProjectsResponse {
    /** Top-level `reorderPinnedProjects` field wrapping the standard API response. */
    reorderPinnedProjects: GraphQLResponse
}
