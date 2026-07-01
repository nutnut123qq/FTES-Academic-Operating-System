import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SubmitChallengeSubmissionRequest, MutateSubmitChallengeSubmissionResponse } from "./types/submit-challenge-submission"

const mutation1 = gql`
  mutation SubmitChallengeSubmission($request: SubmitChallengeSubmissionRequest!) {
    submitChallengeSubmission(request: $request) {
      success
      message
      error
      data {
        jobId
      }
    }
  }
`

export enum MutationSubmitChallengeSubmission {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSubmitChallengeSubmission, DocumentNode> = {
    [MutationSubmitChallengeSubmission.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSubmitChallengeSubmission}. */
export type MutateSubmitChallengeSubmissionParams = MutateParams<
    MutationSubmitChallengeSubmission,
    SubmitChallengeSubmissionRequest
>

/**
 * Queues grading for one challenge submission row for the authenticated user.
 *
 * Mirrors backend `challenge-submissions/submit-challenge-submission`.
 */
export const mutateSubmitChallengeSubmission = async ({
    mutation = MutationSubmitChallengeSubmission.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSubmitChallengeSubmissionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSubmitChallengeSubmissionResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
