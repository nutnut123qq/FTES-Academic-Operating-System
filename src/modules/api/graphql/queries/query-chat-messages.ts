import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { ChatMessagesRequest, QueryChatMessagesResponse } from "./types"

const query1 = gql`
  query ChatMessages($request: ChatMessagesRequest!) {
    chatMessages(request: $request) {
      success
      message
      error
      data {
        items {
          id
          conversationId
          body
          createdAt
          author {
            id
            username
            displayName
            avatar
          }
          isMine
          isFounderAuthor
        }
        nextCursor
      }
    }
  }
`

export enum QueryChatMessages {
    Query1 = "query1",
}

const queryMap: Record<QueryChatMessages, DocumentNode> = {
    [QueryChatMessages.Query1]: query1,
}

/**
 * Cursor-paginated messages of a chat conversation (newest-first). Mirrors
 * `chatMessages` (queries/chat). Access is enforced server-side (member-only).
 */
export const queryChatMessages = async ({
    query = QueryChatMessages.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryChatMessages, ChatMessagesRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryChatMessagesResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
