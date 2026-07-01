import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { VerifyAvatarPresignUrlRequest, MutateVerifyAvatarPresignUrlResponse } from "./types/verify-avatar-presign-url"

const mutation1 = gql`
  mutation VerifyAvatarPresignUrl($request: VerifyAvatarPresignUrlRequest!) {
    verifyAvatarPresignUrl(request: $request) {
      success
      message
      error
      data {
        uploaded
        url
      }
    }
  }
`

export enum MutationVerifyAvatarPresignUrl {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationVerifyAvatarPresignUrl, DocumentNode> = {
    [MutationVerifyAvatarPresignUrl.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateVerifyAvatarPresignUrl}. */
export type MutateVerifyAvatarPresignUrlParams = MutateParams<
    MutationVerifyAvatarPresignUrl,
    VerifyAvatarPresignUrlRequest
>

/**
 * Confirms a direct avatar upload and persists the avatar URL on the user.
 *
 * Mirrors `verifyAvatarPresignUrl` (mutations/profile/verify-avatar-presign-url).
 */
export const mutateVerifyAvatarPresignUrl = async ({
    mutation = MutationVerifyAvatarPresignUrl.Mutation1,
    request,
    debug,
    signal,
}: MutateVerifyAvatarPresignUrlParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateVerifyAvatarPresignUrlResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
