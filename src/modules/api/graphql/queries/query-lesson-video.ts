import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryLessonVideoResponse, LessonVideoRequest } from "./types"

const query1 = gql`
  query LessonVideo($request: LessonVideoRequest!) {
    lessonVideo(request: $request) {
      success
      message
      error
      data {
        id
        createdAt
        updatedAt
        displayId
        title
        description
        kind
        caption
        hostPlatform
        url
        thumbnailUrl
        durationMs
        sortIndex
      }
    }
  }
`

export enum QueryLessonVideo {
    Query1 = "query1",
}

const queryMap: Record<QueryLessonVideo, DocumentNode> = {
    [QueryLessonVideo.Query1]: query1,
}

/**
 * One lesson video by id (`ref/queries/lesson-videos`).
 */
export const queryLessonVideo = async ({
    query = QueryLessonVideo.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryLessonVideo, LessonVideoRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryLessonVideoResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
