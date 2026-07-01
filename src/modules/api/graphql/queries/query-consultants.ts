import { createAuthApolloClient } from "../clients"
import type { QueryParams, SortInput } from "../types"
import { SortOrder } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    ConsultantsListRequest,
    QueryConsultantsResponse,
} from "./types"

export enum ConsultantsSortBy {
    FullName = "fullName",
    SortIndex = "sortIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query Consultants($request: ConsultantsRequest!) {
    consultants(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          displayId
          fullName
          jobTitle
          description
          linkedinUrl
          email
          phoneNumber
          zaloNumber
          avatarUrl
          sortIndex
          companyId
          company {
            id
            displayId
            title
            logoUrl
            websiteUrl
          }
        }
      }
    }
  }
`

export enum QueryConsultants {
    Query1 = "query1",
}

const queryMap: Record<QueryConsultants, DocumentNode> = {
    [QueryConsultants.Query1]: query1,
}

export const defaultConsultantsListSorts: Array<SortInput<ConsultantsSortBy>> = [
    {
        by: ConsultantsSortBy.SortIndex,
        order: SortOrder.Asc,
    },
]

export const defaultConsultantsListLimit = 100

export const queryConsultants = async ({
    query = QueryConsultants.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryConsultants, ConsultantsListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryConsultantsResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
