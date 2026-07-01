import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserProfileResponse } from "./types"

/** Variables for the `userProfile` query. */
export interface QueryUserProfileRequest {
    /** Username of the user whose public profile to fetch (URL-facing handle). */
    username: string
}

const query1 = gql`
  query UserProfile($username: String!) {
    userProfile(username: $username) {
      success
      message
      error
      data {
        id
        username
        displayName
        bio
        avatar
        githubUsername
        createdAt
        followerCount
        followingCount
        isFollowedByMe
        profileLocked
        openToWork
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

export enum QueryUserProfile {
    Query1 = "query1",
}

const queryMap: Record<QueryUserProfile, DocumentNode> = {
    [QueryUserProfile.Query1]: query1,
}

/**
 * Fetches a user's public profile by id via Apollo.
 *
 * Mirrors `userProfile` (queries/users/user-profile/user-profile.resolver.ts);
 * the user is at `data.userProfile.data`.
 */
export const queryUserProfile = async ({
    query = QueryUserProfile.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserProfile, QueryUserProfileRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserProfileResponse>({
        query: queryMap[query],
        variables: {
            username: request?.username,
        },
    })
}
