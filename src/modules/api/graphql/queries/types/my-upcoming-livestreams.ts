import type { GraphQLResponse } from "../../types"

/** One upcoming livestream session for a course the viewer is enrolled in. */
export interface QueryMyUpcomingLivestreamData {
    /** Opaque global id of the course the session belongs to. */
    courseGlobalId: string
    /** Human-readable course title. */
    courseTitle: string
    /** Course display id, used to build the course route. */
    courseDisplayId: string
    /** Title of the specific session, or null when unnamed. */
    sessionTitle: string | null
    /** ISO timestamp when the next session starts (soonest first across the list). */
    nextStartAt: string
    /** ISO timestamp when the session ends, or null when open-ended. */
    nextEndAt: string | null
}

/** Apollo response shape for the `myUpcomingLivestreams` query. */
export interface QueryMyUpcomingLivestreamsResponse {
    /** Top-level `myUpcomingLivestreams` field wrapping the standard API response. */
    myUpcomingLivestreams: GraphQLResponse<Array<QueryMyUpcomingLivestreamData>>
}
