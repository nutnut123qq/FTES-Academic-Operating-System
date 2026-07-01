import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SyncIdealTextRequest, MutateSyncIdealTextResponse } from "./types/sync-ideal-text"

const mutation1 = gql`
  mutation SyncIdealText($request: SyncIdealTextRequest!) {
    syncIdealText(request: $request) {
      success
      message
      error
      data {
        ideaText
      }
    }
  }
`

export enum MutationSyncIdealText {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSyncIdealText, DocumentNode> = {
    [MutationSyncIdealText.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSyncIdealText}. */
export type MutateSyncIdealTextParams = MutateParams<
    MutationSyncIdealText,
    SyncIdealTextRequest
>

/**
 * Syncs (upserts) the user's personal project idea text.
 *
 * Mirrors backend `sync-ideal-text`.
 */
export const mutateSyncIdealText = async ({
    mutation = MutationSyncIdealText.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSyncIdealTextParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSyncIdealTextResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
