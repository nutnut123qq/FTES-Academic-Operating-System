import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyInterviewHistoryResponse } from "./types"

const query1 = gql`
  query MyInterviewHistory($courseId: ID, $flashcardDeckId: ID) {
    myInterviewHistory(courseId: $courseId, flashcardDeckId: $flashcardDeckId) {
      success
      message
      error
      data {
        totalAnswered
        averageScore
        bestScore
        passCount
        borderlineCount
        failCount
        weakTags
        lastAttemptAt
      }
    }
  }
`

export enum QueryMyInterviewHistory {
    Query1 = "query1",
}

const queryMap: Record<QueryMyInterviewHistory, DocumentNode> = {
    [QueryMyInterviewHistory.Query1]: query1,
}

/** Request body for the my-interview-history query. */
export interface MyInterviewHistoryRequest {
    /** Optional course to scope the history to (random-interview mode = course-wide). */
    courseId?: string | null
    /** Optional deck to scope the history to; omit for account-/course-wide history. */
    flashcardDeckId?: string | null
}

/**
 * Fetches the viewer's aggregated mock-interview history (average score, verdict
 * breakdown, weak topics), optionally scoped to one deck. Mirrors backend
 * `myInterviewHistory` (queries/flashcard-decks/my-interview-history). Each call
 * is a fresh read (do not cache — it changes after every graded answer).
 */
export const queryMyInterviewHistory = async ({
    query = QueryMyInterviewHistory.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryMyInterviewHistory, MyInterviewHistoryRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyInterviewHistoryResponse>({
        query: queryMap[query],
        variables: {
            courseId: request?.courseId ?? null,
            flashcardDeckId: request?.flashcardDeckId ?? null,
        },
    })
}
