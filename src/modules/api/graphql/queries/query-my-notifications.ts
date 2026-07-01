import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyNotificationsResponse } from "./types"

const query1 = gql`
  query MyNotifications($limit: Int, $offset: Int, $unreadOnly: Boolean) {
    myNotifications(limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
      success
      message
      error
      data {
        items {
          id
          type
          title {
            key
            params
          }
          body {
            key
            params
          }
          isRead
          target {
            entityName
            id
            label
          }
          readAt
          createdAt
        }
        total
        unreadCount
      }
    }
  }
`

export enum QueryMyNotifications {
    Query1 = "query1",
}

const queryMap: Record<QueryMyNotifications, DocumentNode> = {
    [QueryMyNotifications.Query1]: query1,
}

/** Paging args for {@link queryMyNotifications}. */
export interface QueryMyNotificationsRequest {
    /** Page size (server clamps into [1, 100]); defaults to 20 server-side. */
    limit?: number
    /** Row offset (0-based); defaults to 0 server-side. */
    offset?: number
    /** When `true`, only unread notifications are returned. */
    unreadOnly?: boolean
}

/**
 * Fetches the current user's paginated notification bell list (newest first)
 * together with the unread count for the badge — one round trip drives both the
 * list and the badge. Mirrors `myNotifications`
 * (queries/notifications/my-notifications.resolver.ts).
 */
export const queryMyNotifications = async ({
    query = QueryMyNotifications.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryMyNotifications, QueryMyNotificationsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyNotificationsResponse>({
        query: queryMap[query],
        variables: {
            limit: request?.limit,
            offset: request?.offset,
            unreadOnly: request?.unreadOnly,
        },
    })
}
