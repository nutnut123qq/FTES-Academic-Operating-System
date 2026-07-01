import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyLearnedLessonsResponse } from "./types"

const query1 = gql`
  query MyLearnedLessons {
    myLearnedLessons {
      success
      message
      error
      data {
        globalId
        label
      }
    }
  }
`

export enum QueryMyLearnedLessons {
    Query1 = "query1",
}

const queryMap: Record<QueryMyLearnedLessons, DocumentNode> = {
    [QueryMyLearnedLessons.Query1]: query1,
}

/**
 * Fetches the lessons the viewer recently read (rail list, newest first).
 *
 * Mirrors `myLearnedLessons` (queries/dashboard/my-learned-lessons).
 */
export const queryMyLearnedLessons = async ({
    query = QueryMyLearnedLessons.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyLearnedLessons, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyLearnedLessonsResponse>({
        query: queryMap[query],
    })
}
