import { createAuthApolloClient } from "../clients"
import { gql } from "@apollo/client"
import type {
    ContentAiSessionsRequest,
    QueryContentAiSessionsResponse,
} from "./types/content-ai-sessions"

const query = gql`
  query ContentAiSessions($request: ContentAiSessionsRequest!) {
    contentAiSessions(request: $request) {
      success
      message
      error
      data {
        sessions {
          id
          title
          updatedAt
          messageCount
          originContentId
          originContentTitle
          snippet
        }
      }
    }
  }
`

/** List or search the current user's content-AI conversations. */
export const queryContentAiSessions = async (
    request: ContentAiSessionsRequest,
) => {
    const apollo = createAuthApolloClient({
        cache: false,
    })
    const result = await apollo.query<QueryContentAiSessionsResponse>({
        query,
        variables: { request },
    })
    return result.data?.contentAiSessions
}
