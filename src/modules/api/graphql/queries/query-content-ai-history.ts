import { createAuthApolloClient } from "../clients"
import { gql } from "@apollo/client"
import type {
    ContentAiHistoryRequest,
    QueryContentAiHistoryResponse,
} from "./types/content-ai-history"

const query = gql`
  query ContentAiSessionMessages($request: ContentAiHistoryRequest!) {
    contentAiSessionMessages(request: $request) {
      success
      message
      error
      data {
        messages {
          role
          content
        }
      }
    }
  }
`

/** Load a content-AI conversation's (session's) saved turns. */
export const queryContentAiHistory = async (
    request: ContentAiHistoryRequest,
) => {
    const apollo = createAuthApolloClient({
        cache: false,
    })
    const result = await apollo.query<QueryContentAiHistoryResponse>({
        query,
        variables: { request },
    })
    return result.data?.contentAiSessionMessages
}
