import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyKpisResponse } from "./types"

const query1 = gql`
  query MyKpis {
    myKpis {
      success
      message
      error
      data {
        composite {
          percent
          completed
          total
        }
        items {
          key
          current
          target
        }
      }
    }
  }
`

export enum QueryMyKpis {
    Query1 = "query1",
}

const queryMap: Record<QueryMyKpis, DocumentNode> = {
    [QueryMyKpis.Query1]: query1,
}

/**
 * Fetches the viewer's weekly KPIs (per-KPI progress + composite score).
 * Mirrors `myKpis` (queries/dashboard/my-kpis).
 */
export const queryMyKpis = async ({
    query = QueryMyKpis.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyKpis, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyKpisResponse>({
        query: queryMap[query],
    })
}
