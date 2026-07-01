import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryUserPinnedProjectsRequest,
    QueryUserPinnedProjectsResponse,
} from "./types"

const query1 = gql`
  query UserPinnedProjects($userId: ID!) {
    userPinnedProjects(userId: $userId) {
      success
      message
      error
      data {
        id
        type
        title
        description
        url
        techStack
        orderIndex
        isVerified
      }
    }
  }
`

export enum QueryUserPinnedProjects {
    Query1 = "query1",
}

const queryMap: Record<QueryUserPinnedProjects, DocumentNode> = {
    [QueryUserPinnedProjects.Query1]: query1,
}

/**
 * Fetches a user's pinned projects by id (ordered by `orderIndex` ascending).
 * Public — works for anonymous viewers. Mirrors `userPinnedProjects`
 * (queries/users/user-pinned-projects); list at `data.userPinnedProjects.data`.
 */
export const queryUserPinnedProjects = async ({
    query = QueryUserPinnedProjects.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserPinnedProjects, QueryUserPinnedProjectsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserPinnedProjectsResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
