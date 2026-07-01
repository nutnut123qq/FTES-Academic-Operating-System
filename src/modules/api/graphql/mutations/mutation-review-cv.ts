import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ReviewCvRequest, MutateReviewCvResponse } from "./types/review-cv"

const mutation1 = gql`
  mutation ReviewCv($request: ReviewCvRequest!) {
    reviewCv(request: $request) {
      success
      message
      error
      data {
        jobId
      }
    }
  }
`

export enum MutationReviewCv {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReviewCv, DocumentNode> = {
    [MutationReviewCv.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReviewCv}. */
export type MutateReviewCvParams = MutateParams<
    MutationReviewCv,
    ReviewCvRequest
>

export const mutateReviewCv = async ({
    mutation = MutationReviewCv.Mutation1,
    request,
    debug,
    signal,
    headers,
}: MutateReviewCvParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.mutate<MutateReviewCvResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
