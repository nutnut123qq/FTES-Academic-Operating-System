import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMeResponse } from "./types"

const query1 = gql`
  query Me {
    me {
      success
      message
      error
      data {
        id
        email
        avatar
        username
        displayName
        bio
        githubUsername
        authenticationType
        followerCount
        followingCount
        twoFactorEnabled
        openToWork
        profileLocked
        featuredAchievementSlug
        roleTitle
        location
        workMode
        linkedinUrl
        websiteUrl
      }
    }
  }
`

export enum QueryMe {
    Query1 = "query1",
}

const queryMap: Record<QueryMe, DocumentNode> = {
    [QueryMe.Query1]: query1,
}

/**
 * Fetches the current user via Apollo.
 *
 * @param params - Document key, GraphQL variables
 * @returns Apollo query result; entity at `data.me.data.data`
 */
export const queryMe = async ({
    query = QueryMe.Query1,
    debug,
    signal,
}: QueryParams<QueryMe, undefined>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryMeResponse>({
        query: queryMap[query],
    })
}
