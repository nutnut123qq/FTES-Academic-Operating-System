import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyMembershipResponse } from "./types"

const query1 = gql`
  query MyMembership {
    myMembership {
      success
      message
      error
      data {
        plan
        active
        expiresAt
        offer {
          slug
          displayName
          description
          priceVnd
          durationDays
        }
      }
    }
  }
`

export enum QueryMyMembership {
    Query1 = "query1",
}

const queryMap: Record<QueryMyMembership, DocumentNode> = {
    [QueryMyMembership.Query1]: query1,
}

/**
 * Fetches the VIEWER's membership state plus the membership plan currently on sale.
 *
 * Takes no arguments on purpose — the backend reads the caller's own membership, so
 * there is no way to read someone else's. `data.offer` is null when no
 * `PREMIUM_SUBSCRIPTION` product is published; price and name come from that product
 * row, never from the UI.
 *
 * Mirrors `myMembership` (`SubscriptionCommerceController`).
 */
export const queryMyMembership = async ({
    query = QueryMyMembership.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyMembership, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyMembershipResponse>({
        query: queryMap[query],
    })
}
