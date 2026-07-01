import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { GetCVPresignedUrlRequest, MutateGetCVPresignedUrlResponse } from "./types/get-cv-presigned-url"

const mutation1 = gql`
  mutation GetCVPresignedUrl($request: GetCVPresignedUrlRequest!) {
    getCVPresignedUrl(request: $request) {
      success
      message
      error
      data {
        url
        key
      }
    }
  }
`

export enum MutationGetCVPresignedUrl {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationGetCVPresignedUrl, DocumentNode> = {
    [MutationGetCVPresignedUrl.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateGetCVPresignedUrl}. */
export type MutateGetCVPresignedUrlParams = MutateParams<MutationGetCVPresignedUrl, GetCVPresignedUrlRequest>

/**
 * Gets a presigned URL for uploading CV to S3.
 *
 * Mirrors `ref/cv-upload/get-presigned-url.resolver.ts` (`getCVPresignedUrl`).
 */
export const mutateGetCVPresignedUrl = async ({
    mutation = MutationGetCVPresignedUrl.Mutation1,
    request,
    debug,
    signal,
}: MutateGetCVPresignedUrlParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateGetCVPresignedUrlResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
