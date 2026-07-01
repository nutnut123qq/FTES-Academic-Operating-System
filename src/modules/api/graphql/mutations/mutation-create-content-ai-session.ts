import { createAuthApolloClient } from "../clients"
import { MutateParams } from "../types"
import { gql } from "@apollo/client"
import type {
    CreateContentAiSessionRequest,
    MutateCreateContentAiSessionResponse,
} from "./types/create-content-ai-session"

const mutation = gql`
  mutation CreateContentAiSession($request: CreateContentAiSessionRequest!) {
    createContentAiSession(request: $request) {
      success
      message
      error
      data {
        id
      }
    }
  }
`

/** Apollo params for {@link mutateCreateContentAiSession}. */
export type MutateCreateContentAiSessionParams = MutateParams<
    MutateCreateContentAiSessionResponse,
    CreateContentAiSessionRequest
>

export const mutateCreateContentAiSession = async ({
    request,
    debug,
    headers,
    signal,
}: MutateCreateContentAiSessionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        headers,
        signal,
    })
    const result = await apollo.mutate<MutateCreateContentAiSessionResponse>({
        mutation,
        variables: { request },
    })
    return result.data?.createContentAiSession
}
