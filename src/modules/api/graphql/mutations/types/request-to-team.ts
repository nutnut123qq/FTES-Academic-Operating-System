import type { GraphQLResponse } from "../../types"

/** Request for `requestToTeam`. */
export interface RequestToTeamRequest {
    /** The enrolled course id whose GitHub team to join. */
    courseId: string
}

/** Payload inside `requestToTeam.data`. */
export interface RequestToTeamResponseData {
    /** True when the team-invite job was enqueued (membership becomes "pending"). */
    requested: boolean
    /** Id of the enqueued resolve-github job — subscribe to /job_notifications for realtime status. */
    jobId?: string
}

/** Apollo response shape for `requestToTeam`. */
export interface MutateRequestToTeamResponse {
    /** Top-level field wrapping the standard API response. */
    requestToTeam: GraphQLResponse<RequestToTeamResponseData>
}
