"use client"

import useSWR from "swr"
import {
    getPracticeQuiz,
    getSubjectFlashcards,
    getSubjectStatistics,
} from "@/modules/api/rest/subject/subject"
import { getSubjectDetail } from "@/modules/api/rest/subject"
import { listChallenges } from "@/modules/api/rest/challenges"
import { mapChallengeView, scopeChallengesToSubject } from "./useQuerySubjectCodingChallengesSwr"

/** Practice module key (§10/§11 surfaces inside a subject). */
export type PracticeModuleKey = "quiz" | "flashcards" | "coding" | "leaderboard"

/** A practice module shell with a headline count. */
export interface PracticeModule {
    key: PracticeModuleKey
    /** Headline count shown in the card meta. */
    count: number
}

/** Biggest draw the practice endpoint allows — sizes the quiz bank for the hub meta. */
const QUIZ_BANK_PROBE = 50

/**
 * Loads a subject's practice modules with their headline counts, all from the real BE:
 *
 * - **quiz** — `PracticeQuizView.count` (the true bank size the BE reports),
 * - **flashcards** — `totalCards` of the subject's curated decks,
 * - **coding** — the SAME challenge bank the Coding module lists
 *   (`GET /api/v1/challenges` narrowed to the subject), NOT the empty curated
 *   workspace practice links the hub used to count (that made it always show 0),
 * - **leaderboard** — the number of ranked participants in the subject's leaderboard
 *   (`GET /subjects/{code}/statistics`), NOT a hardcoded 0.
 *
 * Every read is best-effort (auth-gated / may be empty): a failure degrades that one
 * count to `0` rather than failing the hub.
 */
export const useQuerySubjectPracticeSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error } = useSWR(
        code ? (["subject-practice", code] as const) : null,
        async (): Promise<Array<PracticeModule>> => {
            const [quiz, flashcards, detail, views, stats] = await Promise.all([
                getPracticeQuiz(code, { count: QUIZ_BANK_PROBE }).catch(() => null),
                getSubjectFlashcards(code).catch(() => null),
                getSubjectDetail(code).catch(() => null),
                listChallenges().catch(() => []),
                getSubjectStatistics(code).catch(() => null),
            ])
            const now = Date.now()
            const items = (views ?? []).map((view) => mapChallengeView(view, now))
            const bank = scopeChallengesToSubject(items, detail?.id ?? null)
            return [
                { key: "quiz", count: quiz?.count ?? 0 },
                { key: "flashcards", count: flashcards?.totalCards ?? 0 },
                { key: "coding", count: bank.items.length },
                { key: "leaderboard", count: stats?.leaderboard?.length ?? 0 },
            ]
        },
    )
    return { modules: data ?? [], isLoading, error }
}
