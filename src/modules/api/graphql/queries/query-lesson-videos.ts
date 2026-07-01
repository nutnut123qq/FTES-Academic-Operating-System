import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    LessonVideosListRequest,
    QueryLessonVideosResponse,
} from "./types"

/** Sort keys for `lessonVideos` list (`LessonVideosSortBy`). */
export enum LessonVideosSortBy {
    Title = "title",
    SortIndex = "sortIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query LessonVideos($request: LessonVideosRequest!) {
    lessonVideos(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          title
          description
          url
          durationMs
          sortIndex
          thumbnailUrl
        }
      }
    }
  }
`

export enum QueryLessonVideos {
    Query1 = "query1",
}

const queryMap: Record<QueryLessonVideos, DocumentNode> = {
    [QueryLessonVideos.Query1]: query1,
}

export const defaultLessonVideosListSorts: Array<SortInput<LessonVideosSortBy>> = [
    {
        by: LessonVideosSortBy.SortIndex,
        order: SortOrder.Asc,
    },
]

/**
 * Paginated content lesson videos (`ref/queries/lesson-videos/lesson-videos`).
 */
export const queryLessonVideos = async ({
    query = QueryLessonVideos.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryLessonVideos, LessonVideosListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryLessonVideosResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
