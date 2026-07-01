import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SubmitPersonalGithubUrlRequest, MutateSubmitPersonalGithubUrlResponse } from "./types/submit-personal-github-url"

const mutation1 = gql`
  mutation SubmitPersonalGithubUrl($request: SubmitPersonalGithubUrlRequest!) {
    submitPersonalGithubUrl(request: $request) {
      success
      message
      error
      data {
        id
        personalProjectGithubUrl
      }
    }
  }
`

export enum MutationSubmitPersonalGithubUrl {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSubmitPersonalGithubUrl, DocumentNode> = {
    [MutationSubmitPersonalGithubUrl.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSubmitPersonalGithubUrl}. */
export type MutateSubmitPersonalGithubUrlParams = MutateParams<
    MutationSubmitPersonalGithubUrl,
    SubmitPersonalGithubUrlRequest
>

/**
 * Saves personal project GitHub URL for a specific enrollment.
 */
export const mutateSubmitPersonalGithubUrl = async ({
    mutation = MutationSubmitPersonalGithubUrl.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSubmitPersonalGithubUrlParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSubmitPersonalGithubUrlResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
