import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyPinnableCapstonesResponse } from "./types"

const query1 = gql`
  query MyPinnableCapstones {
    myPinnableCapstones {
      success
      message
      error
      data {
        enrollmentId
        courseTitle
        githubUrl
        isVerified
      }
    }
  }
`

export enum QueryMyPinnableCapstones {
    Query1 = "query1",
}

const queryMap: Record<QueryMyPinnableCapstones, DocumentNode> = {
    [QueryMyPinnableCapstones.Query1]: query1,
}

/**
 * Fetches the current user's enrollments that have a capstone repo (the pin
 * picker source).
 *
 * Mirrors `myPinnableCapstones` (queries/users/my-pinnable-capstones).
 */
export const queryMyPinnableCapstones = async ({
    query = QueryMyPinnableCapstones.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyPinnableCapstones, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyPinnableCapstonesResponse>({
        query: queryMap[query],
    })
}
