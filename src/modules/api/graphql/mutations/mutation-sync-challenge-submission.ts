import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SyncSubmissionRequest, MutateSyncChallengeSubmissionsResponse } from "./types/sync-challenge-submission"

const mutation1 = gql`
  mutation SyncSubmission($request: SyncSubmissionRequest!) {
    syncSubmission(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationSyncChallengeSubmissions {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSyncChallengeSubmissions, DocumentNode> = {
    [MutationSyncChallengeSubmissions.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSyncChallengeSubmissions}. */
export type MutateSyncChallengeSubmissionsParams = MutateParams<
    MutationSyncChallengeSubmissions,
    SyncSubmissionRequest
>

/**
 * Upserts one submission URL for the current user (`syncSubmission`).
 *
 * Mirrors backend `challenge-submissions/sync-submission`.
 */
export const mutateSyncChallengeSubmissions = async ({
    mutation = MutationSyncChallengeSubmissions.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSyncChallengeSubmissionsParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSyncChallengeSubmissionsResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
