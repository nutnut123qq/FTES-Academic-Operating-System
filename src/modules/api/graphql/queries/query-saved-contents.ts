import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QuerySavedContentsResponse, SavedContentsRequest } from "./types"

const query1 = gql`
  query SavedContents($request: SavedContentsRequest!) {
    savedContents(request: $request) {
      success
      message
      error
      data {
        contents {
          id
          displayId
          title
          description
          minutesRead
          isPremium
          challenges {
            id
          }
          module {
            id
            course {
              id
              displayId
              title
              coverImageUrl
            }
          }
        }
        count
      }
    }
  }
`

export enum QuerySavedContents {
    Query1 = "query1",
}

const queryMap: Record<QuerySavedContents, DocumentNode> = {
    [QuerySavedContents.Query1]: query1,
}

export const querySavedContents = async ({
    query = QuerySavedContents.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QuerySavedContents, SavedContentsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QuerySavedContentsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
