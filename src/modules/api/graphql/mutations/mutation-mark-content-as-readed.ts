import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { MarkContentAsReadedRequest, MutateMarkContentAsReadedResponse } from "./types/mark-content-as-readed"

const mutation1 = gql`
  mutation MarkContentAsReaded($request: MarkAsReadedRequest!) {
    markContentAsReaded(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationMarkContentAsReaded {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationMarkContentAsReaded, DocumentNode> = {
    [MutationMarkContentAsReaded.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateMarkContentAsReaded}. */
export type MutateMarkContentAsReadedParams = MutateParams<MutationMarkContentAsReaded, MarkContentAsReadedRequest>

export const mutateMarkContentAsReaded = async ({
    mutation = MutationMarkContentAsReaded.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateMarkContentAsReadedParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.mutate<MutateMarkContentAsReadedResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
