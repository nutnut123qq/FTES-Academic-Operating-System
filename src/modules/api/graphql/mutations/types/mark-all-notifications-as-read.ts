import type { GraphQLResponse } from "../../types"

/** Payload inside `markAllNotificationsAsRead.data` after the standard API wrapper. */
export interface MarkAllNotificationsAsReadData {
    /** How many unread rows were flipped to read by the bulk update. */
    markedCount: number
}

/** Apollo response shape for `markAllNotificationsAsRead`. */
export interface MutateMarkAllNotificationsAsReadResponse {
    /** Top-level `markAllNotificationsAsRead` field wrapping the standard API response. */
    markAllNotificationsAsRead: GraphQLResponse<MarkAllNotificationsAsReadData>
}
