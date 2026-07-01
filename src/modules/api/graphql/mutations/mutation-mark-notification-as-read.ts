import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { MarkNotificationAsReadRequest, MutateMarkNotificationAsReadResponse } from "./types/mark-notification-as-read"

const mutation1 = gql`
  mutation MarkNotificationAsRead($request: MarkNotificationAsReadRequest!) {
    markNotificationAsRead(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationMarkNotificationAsRead {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationMarkNotificationAsRead, DocumentNode> = {
    [MutationMarkNotificationAsRead.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateMarkNotificationAsRead}. */
export type MutateMarkNotificationAsReadParams = MutateParams<MutationMarkNotificationAsRead, MarkNotificationAsReadRequest>

/**
 * Marks a single notification as read. Ownership is enforced server-side — an
 * id the current user does not own behaves exactly like a missing one. Mirrors
 * `markNotificationAsRead` (mutations/notifications/mark-notification-as-read).
 */
export const mutateMarkNotificationAsRead = async ({
    mutation = MutationMarkNotificationAsRead.Mutation1,
    request,
    debug,
    signal,
}: MutateMarkNotificationAsReadParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.mutate<MutateMarkNotificationAsReadResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
