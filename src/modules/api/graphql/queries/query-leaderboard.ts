import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryLeaderboardResponse } from "./types"

/**
 * Real BE `leaderboard(scope, subjectId, limit): [LeaderboardEntry!]!` — returns the
 * ranked list DIRECTLY (no envelope). Each entry is `{ rank, score, user{PublicUser} }`.
 *
 * The `/leaderboard` page shows the GLOBAL board (top 20). SUBJECT/WEEKLY scopes exist
 * on the BE but are not surfaced here. The query is auth-only (anonymous callers get 401)
 * and may be empty until gamification XP is seeded into a running season.
 */
const query1 = gql`
  query Leaderboard {
    leaderboard(scope: GLOBAL, limit: 20) {
      rank
      score
      user {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`

export enum QueryLeaderboard {
    Query1 = "query1",
}

const queryMap: Record<QueryLeaderboard, DocumentNode> = {
    [QueryLeaderboard.Query1]: query1,
}

/**
 * Fetches the global gamification leaderboard via Apollo.
 *
 * @param params - Document key, extra headers, abort signal
 * @returns Apollo query result; entries are at `data.leaderboard` (returned directly, no envelope)
 */
export const queryLeaderboard = async ({
    query = QueryLeaderboard.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryLeaderboard, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryLeaderboardResponse>({
        query: queryMap[query],
    })
}
