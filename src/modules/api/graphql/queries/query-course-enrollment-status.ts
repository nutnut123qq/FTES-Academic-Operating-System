import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryCourseEnrollmentStatusRequest,
    QueryCourseEnrollmentStatusResponse,
} from "./types"

const query1 = gql`
  query CourseEnrollmentStatus($request: CourseEnrollmentStatusRequest!) {
    courseEnrollmentStatus(request: $request) {
      success
      message
      error
      data {
        isEnrolled
        enrollment {
          id
          personalProjectGithubUrl
          personalProjectGithubBranch
        }
      }
    }
  }
`

export enum QueryCourseEnrollmentStatus {
    Query1 = "query1",
}

const queryMap: Record<QueryCourseEnrollmentStatus, DocumentNode> = {
    [QueryCourseEnrollmentStatus.Query1]: query1,
}

export type QueryCourseEnrollmentStatusParams = QueryParams<QueryCourseEnrollmentStatus, QueryCourseEnrollmentStatusRequest>

/**
 * Enrollment summary for a course: total count and optional `isEnrolled` when a Bearer token is sent.
 *
 * Mirrors `ref/course-enrollment-status/course-enrollment-status.resolver.ts`.
 */
export const queryCourseEnrollmentStatus = async ({
    query = QueryCourseEnrollmentStatus.Query1,
    request,
    debug,
    signal,
}: QueryCourseEnrollmentStatusParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    }
    )
    return apollo.query<QueryCourseEnrollmentStatusResponse>(
        {
            query: queryMap[query],
            variables: {
                request,
            },
        }
    )
}
