"use client"

import useSWR from "swr"
import {
    getMyQuizAttempts,
    type QuizAttemptHistoryView,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link getMyQuizAttempts}. Gated on `quizId` — pass an empty
 * string (or nullish) to keep the query idle until a quiz id is known. The quiz block
 * revalidates this key after a submit so the freshly-submitted attempt shows at once.
 */
export const useGetMyQuizAttemptsSwr = (quizId: string) => {
    const swr = useSWR<Array<QuizAttemptHistoryView>, Error>(
        quizId ? ["MY_QUIZ_ATTEMPTS_SWR", quizId] : null,
        () => {
            if (!quizId) {
                throw new Error("quizId is required")
            }
            return getMyQuizAttempts(quizId)
        },
        { shouldRetryOnError: false },
    )

    return swr
}
