import { createNoAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryCourseRequest, QueryCourseResponse } from "./types"

const query1 = gql`
  query Course($request: CourseRequest!) {
    course(request: $request) {
      success
      message
      error
      data {
        id
        displayId
        title
        slug
        description
        cdnUrl
        coverImageUrl
        originalPrice
        originalPriceUsd
        currentPhase
        enrollmentCount
        pricingPhases {
          id
          price
          priceUsd
          phase
          slotAvailable
          sortIndex
        }
        prerequisites {
          id
          text
          sortIndex
        }
        valuePropositions {
          id
          text
          sortIndex
        }
        modules {
          id
          displayId
          title
          description
          sortIndex
          contentTier
          isPremium
          numContents
          previewContents {
            id
            sortIndex
            text
          }
          contents {
            id
            displayId
            title
            description
            sortIndex
            minutesRead
            challenges {
              id
            }
          }
        }
        qnas {
          id
          question
          answer
          sortIndex
        }
      }
    }
  }
`

export enum QueryCourse {
    Query1 = "query1",
}

const queryMap: Record<QueryCourse, DocumentNode> = {
    [QueryCourse.Query1]: query1,
}

/**
 * Fetches one course by id via Apollo.
 *
 * @param params - Document key, GraphQL variables
 * @returns Apollo query result; entity at `data.course.data.data`
 */
export const queryCourse = async ({
    query = QueryCourse.Query1,
    request,  
    debug,
    signal,
}: QueryParams<QueryCourse, QueryCourseRequest>) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryCourseResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
