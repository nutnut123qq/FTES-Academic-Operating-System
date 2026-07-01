import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyAchievementsResponse } from "./types"

const query1 = gql`
  fragment AchievementItem on MyAchievementItemData {
    slug
    name
    description
    iconKey
    criteriaType
    threshold
    earned
    earnedAt
    currentValue
    tierReached
    rarityPercent
  }
  query MyAchievements {
    myAchievements {
      success
      message
      error
      data {
        data {
          ...AchievementItem
        }
        count
        newAchievements {
          ...AchievementItem
        }
      }
    }
  }
`

export enum QueryMyAchievements {
    Query1 = "query1",
}

const queryMap: Record<QueryMyAchievements, DocumentNode> = {
    [QueryMyAchievements.Query1]: query1,
}

/**
 * Fetches every achievement with the viewer's earned status + live progress.
 * Mirrors `myAchievements` (queries/achievements/my-achievements).
 */
export const queryMyAchievements = async ({
    query = QueryMyAchievements.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyAchievements, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyAchievementsResponse>({
        query: queryMap[query],
    })
}
