import type { GraphQLResponse, QueryVariables } from "../../types"

/** GraphQL `MarkNotificationAsReadRequest` body. */
export interface MarkNotificationAsReadRequest {
    /** Id of the notification to stamp as read. Must belong to the current user. */
    notificationId: string
}

/** Apollo variables bag for the `markNotificationAsRead` mutation. */
export type MutateMarkNotificationAsReadVariables = QueryVariables<MarkNotificationAsReadRequest>

/** Apollo response shape for `markNotificationAsRead` (no data payload). */
export interface MutateMarkNotificationAsReadResponse {
    /** Top-level `markNotificationAsRead` field wrapping the standard API response. */
    markNotificationAsRead: GraphQLResponse<undefined>
}
