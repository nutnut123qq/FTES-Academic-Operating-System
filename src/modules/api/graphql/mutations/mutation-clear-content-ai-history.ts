import { createAuthApolloClient } from "../clients"
import { MutateParams } from "../types"
import { gql } from "@apollo/client"
import type {
    ClearContentAiHistoryRequest,
    MutateClearContentAiHistoryResponse,
} from "./types/clear-content-ai-history"

const mutation = gql`
  mutation DeleteContentAiSession($request: ClearContentAiHistoryRequest!) {
    deleteContentAiSession(request: $request) {
      success
      message
      error
      data {
        cleared
      }
    }
  }
`

/** Apollo params for {@link mutateClearContentAiHistory}. */
export type MutateClearContentAiHistoryParams = MutateParams<
    MutateClearContentAiHistoryResponse,
    ClearContentAiHistoryRequest
>

export const mutateClearContentAiHistory = async ({
    request,
    debug,
    headers,
    signal,
}: MutateClearContentAiHistoryParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        headers,
        signal,
    })
    const result = await apollo.mutate<MutateClearContentAiHistoryResponse>({
        mutation,
        variables: { request },
    })
    return result.data?.deleteContentAiSession
}
