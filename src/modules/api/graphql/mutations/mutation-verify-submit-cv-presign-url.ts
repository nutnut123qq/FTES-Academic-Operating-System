import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { VerifySubmitCvPresignUrlRequest, MutateVerifySubmitCvPresignUrlResponse } from "./types/verify-submit-cv-presign-url"

const mutation1 = gql`
  mutation VerifySubmitCvPresignUrl($request: VerifySubmitCvPresignUrlRequest!) {
    verifySubmitCvPresignUrl(request: $request) {
      success
      message
      error
      data {
        uploaded
      }
    }
  }
`

export enum MutationVerifySubmitCvPresignUrl {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationVerifySubmitCvPresignUrl, DocumentNode> = {
    [MutationVerifySubmitCvPresignUrl.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateVerifySubmitCvPresignUrl}. */
export type MutateVerifySubmitCvPresignUrlParams = MutateParams<MutationVerifySubmitCvPresignUrl, VerifySubmitCvPresignUrlRequest>

export const mutateVerifySubmitCvPresignUrl = async ({
    mutation = MutationVerifySubmitCvPresignUrl.Mutation1,
    request,
    debug,
    signal,
}: MutateVerifySubmitCvPresignUrlParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateVerifySubmitCvPresignUrlResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
