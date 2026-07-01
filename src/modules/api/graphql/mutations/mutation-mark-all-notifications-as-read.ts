import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { MutateMarkAllNotificationsAsReadResponse } from "./types/mark-all-notifications-as-read"

const mutation1 = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      success
      message
      error
      data {
        markedCount
      }
    }
  }
`

export enum MutationMarkAllNotificationsAsRead {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationMarkAllNotificationsAsRead, DocumentNode> = {
    [MutationMarkAllNotificationsAsRead.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateMarkAllNotificationsAsRead}. */
export type MutateMarkAllNotificationsAsReadParams = MutateParams<MutationMarkAllNotificationsAsRead, void>

/**
 * Marks ALL of the current user's unread notifications as read in one bulk
 * update (the "mark all read" bell action). Returns how many rows were flipped.
 * Mirrors `markAllNotificationsAsRead`
 * (mutations/notifications/mark-all-notifications-as-read).
 */
export const mutateMarkAllNotificationsAsRead = async ({
    mutation = MutationMarkAllNotificationsAsRead.Mutation1,
    debug,
    signal,
}: MutateMarkAllNotificationsAsReadParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.mutate<MutateMarkAllNotificationsAsReadResponse>({
        mutation: mutationMap[mutation],
    })
}
