import { createAuthApolloClient } from "../clients"
import type { QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    MyCourseOutlineRequest,
    QueryMyCourseOutlineResponse,
} from "./types"

const query1 = gql`
  query MyCourseOutline($request: MyCourseOutlineRequest!) {
    myCourseOutline(request: $request) {
      success
      message
      error
      data {
        course {
          id
          title
          displayId
        }
        modules {
          id
          title
          orderIndex
          isPremium
          lessons {
            id
            displayId
            title
            minutesRead
            difficulty
            isPremium
            isRead
            challenges {
              id
              title
              difficulty
              maxScore
              status
              lastScore
              completed
            }
          }
        }
        milestones {
          id
          title
          orderIndex
          tasks {
            id
            title
            type
            maxScore
            completed
            lastScore
          }
        }
        progress {
          lessonsRead
          lessonsTotal
          challengesCompleted
          challengesTotal
          tasksCompleted
          tasksTotal
          completionPercent
        }
        currentTask {
          kind
          id
          milestoneId
        }
        nextContentTask {
          kind
          id
          milestoneId
        }
      }
    }
  }
`

export enum QueryMyCourseOutline {
    Query1 = "query1",
}

const queryMap: Record<QueryMyCourseOutline, DocumentNode> = {
    [QueryMyCourseOutline.Query1]: query1,
}

/**
 * The authenticated viewer's full outline for ONE enrolled course
 * (`myCourseOutline`): the module/lesson/challenge tree plus the milestone/task
 * tree, with read flags + challenge/task progress overlaid and a current-task
 * pointer. `request.courseId` is the RAW course entity id (decode a
 * `myCourses[].globalId` with `fromGlobalId`).
 */
export const queryMyCourseOutline = async ({
    query = QueryMyCourseOutline.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryMyCourseOutline, MyCourseOutlineRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryMyCourseOutlineResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
