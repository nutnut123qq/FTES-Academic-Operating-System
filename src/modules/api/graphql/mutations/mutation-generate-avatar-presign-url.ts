import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { GenerateAvatarPresignUrlRequest, MutateGenerateAvatarPresignUrlResponse } from "./types/generate-avatar-presign-url"

const mutation1 = gql`
  mutation GenerateAvatarPresignUrl($request: GenerateAvatarPresignUrlRequest!) {
    generateAvatarPresignUrl(request: $request) {
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

export enum MutationGenerateAvatarPresignUrl {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationGenerateAvatarPresignUrl, DocumentNode> = {
    [MutationGenerateAvatarPresignUrl.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateGenerateAvatarPresignUrl}. */
export type MutateGenerateAvatarPresignUrlParams = MutateParams<
    MutationGenerateAvatarPresignUrl,
    GenerateAvatarPresignUrlRequest
>

/**
 * Mints a pre-signed PUT URL for uploading an avatar directly to MinIO.
 *
 * Mirrors `generateAvatarPresignUrl` (mutations/profile/generate-avatar-presign-url).
 */
export const mutateGenerateAvatarPresignUrl = async ({
    mutation = MutationGenerateAvatarPresignUrl.Mutation1,
    request,
    debug,
    signal,
}: MutateGenerateAvatarPresignUrlParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateGenerateAvatarPresignUrlResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
