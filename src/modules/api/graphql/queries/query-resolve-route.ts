import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { ResolveRouteRequest, QueryResolveRouteResponse } from "./types"

const query1 = gql`
  query ResolveRoute($request: ResolveRouteRequest!) {
    resolveRoute(request: $request) {
      success
      message
      error
      data {
        path
      }
    }
  }
`

export enum QueryResolveRoute {
    Query1 = "query1",
}

const queryMap: Record<QueryResolveRoute, DocumentNode> = {
    [QueryResolveRoute.Query1]: query1,
}

/**
 * Route index ("index server"): resolve an opaque entity global id into its
 * canonical, locale-agnostic path. Called imperatively on click (feed tokens,
 * deep-links). Mirrors `resolveRoute` (queries/autocomplete/resolve-route).
 */
export const queryResolveRoute = async ({
    query = QueryResolveRoute.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryResolveRoute, ResolveRouteRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryResolveRouteResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
