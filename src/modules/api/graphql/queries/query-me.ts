import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMeResponse } from "./types"

/**
 * Real BE `me: Viewer!` — returns the Viewer object directly (NO envelope).
 * `PublicUser` is non-PII only (id/username/displayName/avatarUrl); rich profile
 * fields (email/bio/…) come from REST `GET /api/v1/profiles/me`, merged in the hook.
 */
const query1 = gql`
  query Me {
    me {
      user {
        id
        username
        displayName
        avatarUrl
      }
      progression {
        totalXp
        level
        levelTitle
        reputation
      }
      permissions
      scopedGrants {
        roleCode
        scopeType
        scopeId
        expiresAt
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
 * Fetches the current viewer via Apollo.
 *
 * @param params - Document key, GraphQL variables
 * @returns Apollo query result; the viewer is at `data.me` (returned directly, no envelope)
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
