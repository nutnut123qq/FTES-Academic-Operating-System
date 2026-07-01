import { createAuthApolloClient } from "../clients"
import { MutateParams } from "../types"
import { gql } from "@apollo/client"
import type {
    TouchContentAiSessionRequest,
    MutateTouchContentAiSessionResponse,
} from "./types/touch-content-ai-session"

const mutation = gql`
  mutation TouchContentAiSession($request: TouchContentAiSessionRequest!) {
    touchContentAiSession(request: $request) {
      success
      message
      error
      data {
        touched
      }
    }
  }
`

/** Apollo params for {@link mutateTouchContentAiSession}. */
export type MutateTouchContentAiSessionParams = MutateParams<
    MutateTouchContentAiSessionResponse,
    TouchContentAiSessionRequest
>

export const mutateTouchContentAiSession = async ({
    request,
    debug,
    headers,
    signal,
}: MutateTouchContentAiSessionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        headers,
        signal,
    })
    const result = await apollo.mutate<MutateTouchContentAiSessionResponse>({
        mutation,
        variables: { request },
    })
    return result.data?.touchContentAiSession
}
