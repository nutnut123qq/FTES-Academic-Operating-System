"use client"

import useSWR from "swr"

/** Practice module key (§10/§11 surfaces inside a subject). */
export type PracticeModuleKey = "quiz" | "flashcards" | "coding" | "leaderboard"

/** A practice module shell with a headline count (mock until BE lands). */
export interface PracticeModule {
    key: PracticeModuleKey
    /** Headline count shown in the card meta. */
    count: number
}

// ponytail: mock BE — no practice endpoint yet. Deterministic sample.
const fetchPracticeMock = async (): Promise<Array<PracticeModule>> => [
    { key: "quiz", count: 3 },
    { key: "flashcards", count: 120 },
    { key: "coding", count: 8 },
    { key: "leaderboard", count: 240 },
]

/** Loads a subject's practice modules. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectPracticeSwr = (subjectId: string) => {
    const { data, isLoading, error } = useSWR(
        ["subject-practice", subjectId],
        () => fetchPracticeMock(),
    )
    return { modules: data ?? [], isLoading, error }
}
