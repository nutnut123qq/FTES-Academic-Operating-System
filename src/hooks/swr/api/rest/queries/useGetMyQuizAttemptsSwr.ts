"use client"

import useSWR from "swr"
import {
    getMyQuizAttempts,
    type QuizAttemptHistoryView,
} from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's attempt history on one quiz. */
export const MY_QUIZ_ATTEMPTS_SWR_KEY = "MY_QUIZ_ATTEMPTS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyQuizAttemptsSwr}. `null` disables
 * the fetch (guest / unresolved viewer, or no quiz id). Import this from a call site
 * that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myQuizAttemptsKey = (viewerId: string | null, quizId: string) =>
    viewerId && quizId ? ([MY_QUIZ_ATTEMPTS_SWR_KEY, viewerId, quizId] as const) : null

/**
 * SWR query wrapper for {@link getMyQuizAttempts}. Gated on `quizId` — pass an empty
 * string (or nullish) to keep the query idle until a quiz id is known. The quiz block
 * revalidates this key after a submit so the freshly-submitted attempt shows at once
 * (it does so through the `mutate` this hook returns, which always matches the live key).
 *
 * The key also carries the VIEWER ID: `quizId` names the quiz, not the taker, so the old
 * key made one attempt history shared by every account — B would be shown A's scores and,
 * because the attempt-cap UI counts these rows, could be locked out of a quiz B never took.
 */
export const useGetMyQuizAttemptsSwr = (quizId: string) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<Array<QuizAttemptHistoryView>, Error>(
        authenticated ? myQuizAttemptsKey(viewerId, quizId) : null,
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
