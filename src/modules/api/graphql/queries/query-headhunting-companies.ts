import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryHeadhuntingCompaniesResponse } from "./types"

const query1 = gql`
  query HeadhuntingCompanies {
    headhuntingCompanies {
      success
      message
      error
      data {
        id
        displayId
        title
        description
        websiteUrl
        logoUrl
        address
        phone
        email
        facebookUrl
        linkedinUrl
        sortIndex
      }
    }
  }
`

export enum QueryHeadhuntingCompanies {
    Query1 = "query1",
}

const queryMap: Record<QueryHeadhuntingCompanies, DocumentNode> = {
    [QueryHeadhuntingCompanies.Query1]: query1,
}

export const queryHeadhuntingCompanies = async ({
    query = QueryHeadhuntingCompanies.Query1,
    debug,
    headers,
    signal,
}: QueryParams<QueryHeadhuntingCompanies>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers,
    })

    return apollo.query<QueryHeadhuntingCompaniesResponse>({
        query: queryMap[query],
    })
}
