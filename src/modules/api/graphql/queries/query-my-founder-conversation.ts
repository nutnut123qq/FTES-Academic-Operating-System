import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyFounderConversationResponse } from "./types"

const query1 = gql`
  query MyFounderConversation {
    myFounderConversation {
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

export enum QueryMyFounderConversation {
    Query1 = "query1",
}

const queryMap: Record<QueryMyFounderConversation, DocumentNode> = {
    [QueryMyFounderConversation.Query1]: query1,
}

/**
 * Returns the viewer's private founder DM conversation handle (created on first
 * open). Mirrors `myFounderConversation` (queries/chat).
 */
export const queryMyFounderConversation = async ({
    query = QueryMyFounderConversation.Query1,
    debug,
    signal,
}: QueryParams<QueryMyFounderConversation, undefined>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryMyFounderConversationResponse>({
        query: queryMap[query],
    })
}
