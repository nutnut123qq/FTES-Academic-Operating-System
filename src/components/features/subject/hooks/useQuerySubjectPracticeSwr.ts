"use client"

import useSWR from "swr"
import { getSubjectStatistics } from "@/modules/api/rest/subject/subject"
import { getSubjectDetail } from "@/modules/api/rest/subject"
import { listResources } from "@/modules/api/rest/resource"
import { listChallenges } from "@/modules/api/rest/challenges"
import { mapChallengeView, scopeChallengesToSubject } from "./useQuerySubjectCodingChallengesSwr"
import { BE_EXAM_TYPE } from "./useQuerySubjectExamsSwr"

/** Practice module key (§10/§11 surfaces inside a subject). */
export type PracticeModuleKey = "pe" | "fe" | "coding" | "leaderboard"

/** A practice module shell with a headline count. */
export interface PracticeModule {
    key: PracticeModuleKey
    /** Headline count shown in the card meta. */
    count: number
}

/**
 * Probe page size for the PE/FE counts. The hub only needs the envelope's `total`, so
 * one row is enough payload to read it.
 */
const EXAM_COUNT_PROBE = 1

/**
 * Loads a subject's practice modules with their headline counts, all from the real BE:
 *
 * - **pe** — number of Practical Exam papers published for the subject
 *   (`GET /resources?subjectId=&type=PE` → the page `total`),
 * - **fe** — number of Final Exam albums (`…&type=FE`). These two types are no longer
 *   listed by the Resource tab, so this is the only surface that counts them,
 * - **coding** — the SAME challenge bank the Coding module lists
 *   (`GET /api/v1/challenges` narrowed to the subject),
 * - **leaderboard** — the number of ranked participants in the subject's leaderboard
 *   (`GET /subjects/{code}/statistics`).
 *
 * Every read is best-effort (auth-gated / may be empty): a failure degrades that one
 * count to `0` rather than failing the hub.
 */
export const useQuerySubjectPracticeSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error } = useSWR(
        code ? (["subject-practice", code] as const) : null,
        async (): Promise<Array<PracticeModule>> => {
            const detail = await getSubjectDetail(code).catch(() => null)
            // The resource list keys on the subject UUID; without it the exam counts
            // simply degrade to 0 instead of listing every subject's exams.
            const examPage = (type: string) =>
                detail
                    ? listResources({
                        subjectId: detail.id,
                        type,
                        size: EXAM_COUNT_PROBE,
                    }).catch(() => null)
                    : Promise.resolve(null)

            const [pe, fe, views, stats] = await Promise.all([
                examPage(BE_EXAM_TYPE.pe),
                examPage(BE_EXAM_TYPE.fe),
                listChallenges().catch(() => []),
                getSubjectStatistics(code).catch(() => null),
            ])
            const now = Date.now()
            const items = (views ?? []).map((view) => mapChallengeView(view, now))
            const bank = scopeChallengesToSubject(items, detail?.id ?? null)
            return [
                { key: "pe", count: pe?.total ?? 0 },
                { key: "fe", count: fe?.total ?? 0 },
                { key: "coding", count: bank.items.length },
                { key: "leaderboard", count: stats?.leaderboard?.length ?? 0 },
            ]
        },
    )
    return { modules: data ?? [], isLoading, error }
}
