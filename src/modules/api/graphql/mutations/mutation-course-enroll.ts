import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { CourseEnrollRequest, MutateCourseEnrollResponse } from "./types/course-enroll"

const mutation1 = gql`
  mutation CourseEnroll($request: CourseEnrollRequest!) {
    courseEnroll(request: $request) {
      success
      message
      error
      data {
        checkoutUrl
        transactionId
        referenceId
        amount
        checkoutFields
      }
    }
  }
`

export enum MutationCourseEnroll {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationCourseEnroll, DocumentNode> = {
    [MutationCourseEnroll.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateCourseEnroll}. */
export type MutateCourseEnrollParams = MutateParams<MutationCourseEnroll, CourseEnrollRequest>

/**
 * Starts course checkout (PayOS or Sepay): creates preflight row and returns checkout URL / ids.
 *
 * Mirrors `ref/course-enroll/course-enroll.resolver.ts` (`courseEnroll`).
 */
export const mutateCourseEnroll = async ({
    mutation = MutationCourseEnroll.Mutation1,
    request,
    debug,
    signal,
}: MutateCourseEnrollParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateCourseEnrollResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
