import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryTemplateCvsResponse } from "./types"

const query1 = gql`
  query TemplateCvs {
    templateCvs {
      success
      message
      error
      data {
        id
        title
        description
      }
    }
  }
`

export enum QueryTemplateCvs {
  Query1 = "query1",
}

const queryMap: Record<QueryTemplateCvs, DocumentNode> = {
    [QueryTemplateCvs.Query1]: query1,
}

export const queryTemplateCvs = async ({
    query = QueryTemplateCvs.Query1,
    debug,
    headers,
    signal,
}: QueryParams<QueryTemplateCvs>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers
    })

    return apollo.query<QueryTemplateCvsResponse>({
        query: queryMap[query],
    })
}
