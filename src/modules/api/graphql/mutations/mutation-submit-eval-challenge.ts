import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SubmitEvalChallengeInput, MutateSubmitEvalChallengeResponse } from "./types/submit-eval-challenge"

const mutation1 = gql`
  mutation SubmitEvalChallenge($input: SubmitEvalChallengeInput!) {
    submitEvalChallenge(input: $input) {
      success
      message
      error
      data {
        evalRunId
        jobId
      }
    }
  }
`

export enum MutationSubmitEvalChallenge {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSubmitEvalChallenge, DocumentNode> = {
    [MutationSubmitEvalChallenge.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSubmitEvalChallenge}. */
export type MutateSubmitEvalChallengeParams = MutateParams<
    MutationSubmitEvalChallenge,
    SubmitEvalChallengeInput
>

/**
 * Queues grading of an AI Lab eval challenge for the authenticated, enrolled user.
 * Returns an `evalRunId` + `jobId`; track the job via `/job_notifications` and
 * refetch `aiLabEvalResult(evalRunId)` once it completes. Backend mutation takes
 * a single `input` arg (not a `request` wrapper).
 *
 * Mirrors backend `mutations/ai-lab/submit-eval-challenge`.
 */
export const mutateSubmitEvalChallenge = async ({
    mutation = MutationSubmitEvalChallenge.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSubmitEvalChallengeParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSubmitEvalChallengeResponse>({
        mutation: mutationMap[mutation],
        variables: { input: request },
    })
}
