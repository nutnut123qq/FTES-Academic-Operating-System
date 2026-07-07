"use client"

import useSWR from "swr"
import { getSubjectWorkspace } from "@/modules/api/rest/subject/subject"

/** Practice module key (§10/§11 surfaces inside a subject). */
export type PracticeModuleKey = "quiz" | "flashcards" | "coding" | "leaderboard"

/** A practice module shell with a headline count. */
export interface PracticeModule {
    key: PracticeModuleKey
    /** Headline count shown in the card meta. */
    count: number
}

/**
 * Loads a subject's practice modules. The module set is the feature's fixed hub
 * registry; the counts come from the real BE workspace aggregate
 * (`GET /api/v1/subjects/{code}/workspace` → `practice.links`). Only the coding bank
 * has a workspace-backed count today (the practice link list); quiz/flashcards/
 * leaderboard have no honest per-subject count and report zero. The seeded subjects
 * carry no practice links, so every count is `0` — an honest "nothing yet" hub.
 */
export const useQuerySubjectPracticeSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error } = useSWR(
        code ? (["subject-practice", code] as const) : null,
        async (): Promise<Array<PracticeModule>> => {
            const ws = await getSubjectWorkspace(code)
            const codingCount = ws.practice.data?.links.length ?? 0
            return [
                { key: "quiz", count: 0 },
                { key: "flashcards", count: 0 },
                { key: "coding", count: codingCount },
                { key: "leaderboard", count: 0 },
            ]
        },
    )
    return { modules: data ?? [], isLoading, error }
}
