import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SyncPersonalProjectGithubRequest, MutateSyncPersonalProjectGithubResponse } from "./types/sync-personal-project-github"

const mutation1 = gql`
  mutation SyncPersonalProjectGithub($request: SyncPersonalProjectGithubRequest!) {
    syncPersonalProjectGithub(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationSyncPersonalProjectGithub {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSyncPersonalProjectGithub, DocumentNode> = {
    [MutationSyncPersonalProjectGithub.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSyncPersonalProjectGithub}. */
export type MutateSyncPersonalProjectGithubParams = MutateParams<
    MutationSyncPersonalProjectGithub,
    SyncPersonalProjectGithubRequest
>

/**
 * Syncs (upserts) the user's personal project GitHub URL.
 *
 * Mirrors backend `sync-personal-project-github`.
 */
export const mutateSyncPersonalProjectGithub = async ({
    mutation = MutationSyncPersonalProjectGithub.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSyncPersonalProjectGithubParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSyncPersonalProjectGithubResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
