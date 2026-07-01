import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { CommunityPostCommentsRequest, QueryCommunityPostCommentsResponse } from "./types"

const query1 = gql`
  query CommunityPostComments($request: CommunityPostCommentsRequest!) {
    communityPostComments(request: $request) {
      success
      message
      error
      data {
        comments {
          id
          body
          isDeleted
          editedAt
          createdAt
          parentCommentId
          author {
            id
            username
            displayName
            avatar
          }
          replyCount
          reactions {
            total
            myReaction
          }
          isFounderAuthor
        }
        total
      }
    }
  }
`

export enum QueryCommunityPostComments {
    Query1 = "query1",
}

const queryMap: Record<QueryCommunityPostComments, DocumentNode> = {
    [QueryCommunityPostComments.Query1]: query1,
}

/**
 * Lists a community post's comments (top-level, or one parent's replies). Mirrors
 * `communityPostComments` (queries/community/community-post-comments). Open to
 * everyone; the viewer's own reaction is only populated when authenticated.
 */
export const queryCommunityPostComments = async ({
    query = QueryCommunityPostComments.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCommunityPostComments, CommunityPostCommentsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryCommunityPostCommentsResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
