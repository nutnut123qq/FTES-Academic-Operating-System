import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryAutocompleteGlobalSearchRequest,
    QueryAutocompleteGlobalSearchResponse,
} from "./types"

const query1 = gql`
  query AutocompleteGlobalSearch($request: AutocompleteGlobalSearchRequest!) {
    autocompleteGlobalSearch(request: $request) {
      success
      message
      error
      data {
        courses {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } module { id displayId } content { id displayId } challenge { id displayId } }
        }
        modules {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } module { id displayId } content { id displayId } challenge { id displayId } }
        }
        challenges {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } module { id displayId } content { id displayId } challenge { id displayId } }
        }
        contents {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } module { id displayId } content { id displayId } challenge { id displayId } }
        }
        lessonVideos {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } module { id displayId } content { id displayId } challenge { id displayId } }
        }
        flashcardDecks {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } }
        }
        milestones {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } task { id displayId } }
        }
        milestoneTasks {
          id
          displayId
          title
          texts
          parentPath { course { id displayId } }
        }
      }
    }
  }
`

export enum QueryAutocompleteGlobalSearch {
    Query1 = "query1",
}

const queryMap: Record<QueryAutocompleteGlobalSearch, DocumentNode> = {
    [QueryAutocompleteGlobalSearch.Query1]: query1,
}

export const queryAutocompleteGlobalSearch = async ({
    query = QueryAutocompleteGlobalSearch.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryAutocompleteGlobalSearch, QueryAutocompleteGlobalSearchRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.query<QueryAutocompleteGlobalSearchResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
