import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { ContentCommentsRequest, QueryContentCommentsResponse } from "./types"

const query1 = gql`
  query ContentComments($request: ContentCommentsRequest!) {
    contentComments(request: $request) {
      success
      message
      error
      data {
        total
        comments {
          id
          body
          isDeleted
          editedAt
          createdAt
          parentCommentId
          replyCount
          author {
            id
            username
            avatar
          }
          reactions {
            total
            myReaction
            counts {
              type
              count
            }
          }
        }
      }
    }
  }
`

/** Variant selector for {@link queryContentComments}. */
export enum QueryContentComments {
    Query1 = "query1",
}

const queryMap: Record<QueryContentComments, DocumentNode> = {
    [QueryContentComments.Query1]: query1,
}

/** Apollo params for {@link queryContentComments}. */
export type QueryContentCommentsParams = QueryParams<QueryContentComments, ContentCommentsRequest>

/** Lists comments (top-level or replies) of a content. */
export const queryContentComments = async ({
    query = QueryContentComments.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryContentCommentsParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryContentCommentsResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
