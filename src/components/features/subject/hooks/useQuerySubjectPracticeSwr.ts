"use client"

import useSWR from "swr"
import {
    getPracticeQuiz,
    getSubjectFlashcards,
    getSubjectWorkspace,
} from "@/modules/api/rest/subject/subject"

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
 * - **quiz** — how many questions a maximum draw returns
 *   (`GET /subjects/{code}/practice/quiz?count=50`; the BE caps at 50, so it is exact
 *   for a small bank and a floor for a large one),
 * - **flashcards** — `totalCards` of the subject's curated decks,
 * - **coding** — the workspace practice links (`GET /subjects/{code}/workspace`),
 * - **leaderboard** — no per-subject participant facet on the BE, so it stays `0`.
 *
 * The two practice reads are authenticated and only decorate the hub, so a failure
 * (a guest 401, a subject without a bank) degrades to `0` rather than failing the hub.
 */
export const useQuerySubjectPracticeSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error } = useSWR(
        code ? (["subject-practice", code] as const) : null,
        async (): Promise<Array<PracticeModule>> => {
            const [ws, quiz, flashcards] = await Promise.all([
                getSubjectWorkspace(code),
                getPracticeQuiz(code, { count: QUIZ_BANK_PROBE }).catch(() => null),
                getSubjectFlashcards(code).catch(() => null),
            ])
            return [
                { key: "quiz", count: quiz?.questions?.length ?? 0 },
                { key: "flashcards", count: flashcards?.totalCards ?? 0 },
                { key: "coding", count: ws.practice.data?.links.length ?? 0 },
                { key: "leaderboard", count: 0 },
            ]
        },
    )
    return { modules: data ?? [], isLoading, error }
}
