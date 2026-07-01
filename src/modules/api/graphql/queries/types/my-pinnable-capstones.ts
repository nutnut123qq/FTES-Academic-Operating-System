import type { GraphQLResponse } from "../../types"

/**
 * One pinnable capstone candidate — an enrollment of the signed-in user that
 * already has a project repo (a submitted GitHub URL or a completed task plan).
 * Feeds the "pin a course project" picker.
 */
export interface QueryMyPinnableCapstoneItemData {
    /** Enrollment id — pass to `pinCourseProject` as `enrollmentId`. */
    enrollmentId: string
    /** Title of the course this enrollment belongs to (picker label). */
    courseTitle: string
    /** Submitted personal-project GitHub URL, or null if none. */
    githubUrl: string | null
    /** Whether the capstone's task plan is complete ("Verified by FTES AOS"). */
    isVerified: boolean
}

/**
 * Apollo response shape for the `myPinnableCapstones` query — the current user's
 * enrollments that have a capstone repo, wrapped in the standard API envelope.
 */
export interface QueryMyPinnableCapstonesResponse {
    /** Top-level `myPinnableCapstones` field wrapping the standard API response. */
    myPinnableCapstones: GraphQLResponse<Array<QueryMyPinnableCapstoneItemData>>
}
