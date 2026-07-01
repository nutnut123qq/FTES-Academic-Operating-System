import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryCommunityChatConversationResponse } from "./types"

const query1 = gql`
  query CommunityChatConversation {
    communityChatConversation {
      success
      message
      error
      data {
        id
        type
      }
    }
  }
`

export enum QueryCommunityChatConversation {
    Query1 = "query1",
}

const queryMap: Record<QueryCommunityChatConversation, DocumentNode> = {
    [QueryCommunityChatConversation.Query1]: query1,
}

/**
 * Returns the global community chat conversation handle (created on first access).
 * Mirrors `communityChatConversation` (queries/chat).
 */
export const queryCommunityChatConversation = async ({
    query = QueryCommunityChatConversation.Query1,
    debug,
    signal,
}: QueryParams<QueryCommunityChatConversation, undefined>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryCommunityChatConversationResponse>({
        query: queryMap[query],
    })
}
