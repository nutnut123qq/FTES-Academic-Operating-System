import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryFlashcardDecksByCourseResponse } from "./types"

const query1 = gql`
  query FlashcardDecksByCourse($courseId: ID!, $contentId: ID) {
    flashcardDecksByCourse(courseId: $courseId, contentId: $contentId) {
      success
      message
      error
      data {
        id
        displayId
        title
        description
        difficulty
        sortIndex
        defaultLocale
        dueCount
        masteredCount
        cards {
          id
          sortIndex
        }
      }
    }
  }
`

export enum QueryFlashcardDecksByCourse {
    Query1 = "query1",
}

const queryMap: Record<QueryFlashcardDecksByCourse, DocumentNode> = {
    [QueryFlashcardDecksByCourse.Query1]: query1,
}

/** Request body for the flashcard-decks-by-course query. */
export interface FlashcardDecksByCourseRequest {
    /** Owning course id. */
    courseId: string
    /** Optional content id to filter the course's decks. */
    contentId?: string
}

/**
 * Lists the interview-prep flashcard decks owned by a course (optionally filtered by content).
 */
export const queryFlashcardDecksByCourse = async ({
    query = QueryFlashcardDecksByCourse.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryFlashcardDecksByCourse, FlashcardDecksByCourseRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryFlashcardDecksByCourseResponse>({
        query: queryMap[query],
        variables: {
            courseId: request?.courseId,
            contentId: request?.contentId,
        },
    })
}
