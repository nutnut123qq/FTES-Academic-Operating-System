import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryCoursePricePreviewResponse } from "./types"

const query1 = gql`
  query CoursePricePreview($courseId: ID!) {
    coursePricePreview(courseId: $courseId) {
      success
      message
      error
      data {
        originalPriceVnd
        phasePriceVnd
        discountedPriceVnd
        discountPercent
        originalPriceUsd
        phasePriceUsd
        discountedPriceUsd
        discountReason
        enrolledCount
      }
    }
  }
`

export enum QueryCoursePricePreview {
    Query1 = "query1",
}

const queryMap: Record<QueryCoursePricePreview, DocumentNode> = {
    [QueryCoursePricePreview.Query1]: query1,
}

/** Params for {@link queryCoursePricePreview}. */
export interface QueryCoursePricePreviewParams {
    /** Which document variant to run. */
    query?: QueryCoursePricePreview
    /** Course id to price. */
    courseId: string
    /** Apollo debug flag. */
    debug?: boolean
    /** Abort signal. */
    signal?: AbortSignal
}

/**
 * Pre-checkout price for a course: original vs loyalty-discounted (VND always, USD
 * when set) computed with the exact checkout pricing. Mirrors backend
 * `coursePricePreview` — lets the payment modal show "what + how much + why discounted".
 */
export const queryCoursePricePreview = async ({
    query = QueryCoursePricePreview.Query1,
    courseId,
    debug,
    signal,
}: QueryCoursePricePreviewParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryCoursePricePreviewResponse>({
        query: queryMap[query],
        variables: {
            courseId,
        },
    })
}
