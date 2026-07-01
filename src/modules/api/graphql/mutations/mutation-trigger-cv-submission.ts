import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { TriggerCvSubmissionRequest, MutateTriggerCvSubmissionResponse } from "./types/trigger-cv-submission"

const mutation1 = gql`
  mutation TriggerCvSubmission($request: TriggerCvSubmissionRequest!) {
    triggerCvSubmission(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationTriggerCvSubmission {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationTriggerCvSubmission, DocumentNode> = {
    [MutationTriggerCvSubmission.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateTriggerCvSubmission}. */
export type MutateTriggerCvSubmissionParams = MutateParams<
    MutationTriggerCvSubmission,
    TriggerCvSubmissionRequest
>

export const mutateTriggerCvSubmission = async ({
    mutation = MutationTriggerCvSubmission.Mutation1,
    request,
    debug,
    signal,
}: MutateTriggerCvSubmissionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateTriggerCvSubmissionResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
