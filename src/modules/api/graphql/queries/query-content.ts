import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryContentResponse, ContentRequest } from "./types"

const query1 = gql`
  query Content($request: ContentRequest!) {
    content(request: $request) {
      success
      message
      error
      data {
        id
        displayId
        description
        sortIndex
        minutesRead
        isPremium
        isSandbox
        githubBaseUrl
        githubDir
        backendUrl
        e2eFlows
        title
        body
        outcomes {
          id
          text
          sortIndex
        }
        challenges {
          id
        }
        codeExplainings {
          id
          sortIndex
          lang
          code
          explain
        }
        codeImplementations {
          id
          sortIndex
          lang
          guide
          example
        }
        bodies {
          id
          lang
          sortIndex
          body
          defaultLocale
          translations {
            locale
            body
          }
        }
        verified
        defaultLocale
      }
    }
  }
`

export enum QueryContent {
    Query1 = "query1",
}

const queryMap: Record<QueryContent, DocumentNode> = {
    [QueryContent.Query1]: query1,
}

/**
 * One module content row by id (`ref/queries/contents`).
 */
export const queryContent = async ({
    query = QueryContent.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryContent, ContentRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryContentResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
