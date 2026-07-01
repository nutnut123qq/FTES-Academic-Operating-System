import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { GenerateSubmitCvPresignUrlRequest, MutateGenerateSubmitCvPresignUrlResponse } from "./types/generate-submit-cv-presign-url"

const mutation1 = gql`
  mutation GenerateSubmitCvPresignUrl($request: GenerateSubmitCvPresignUrlRequest!) {
    generateSubmitCvPresignUrl(request: $request) {
      success
      message
      error
      data {
        url
        cvSubmissionId
      }
    }
  }
`

export enum MutationGenerateSubmitCvPresignUrl {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationGenerateSubmitCvPresignUrl, DocumentNode> = {
    [MutationGenerateSubmitCvPresignUrl.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateGenerateSubmitCvPresignUrl}. */
export type MutateGenerateSubmitCvPresignUrlParams = MutateParams<MutationGenerateSubmitCvPresignUrl, GenerateSubmitCvPresignUrlRequest>

export const mutateGenerateSubmitCvPresignUrl = async ({
    mutation = MutationGenerateSubmitCvPresignUrl.Mutation1,
    request,
    debug,
    signal,
}: MutateGenerateSubmitCvPresignUrlParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateGenerateSubmitCvPresignUrlResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
