"use client"

import useSWR from "swr"
import { getSubjectStatistics } from "@/modules/api/rest/subject/subject"
import { getSubjectDetail } from "@/modules/api/rest/subject"
import { listResources } from "@/modules/api/rest/resource"
import { listChallenges } from "@/modules/api/rest/challenges"
import { narrowBankRows, toBankRows } from "./useQuerySubjectCodingChallengesSwr"
import { BE_EXAM_TYPE } from "./useQuerySubjectExamsSwr"

/**
 * Practice module key (§10/§11 surfaces inside a subject).
 *
 * `pe` is deliberately NOT one: Practical Exam papers are challenges now (tagged `pe` +
 * the subject code) and live in the `coding` bank, so the hub has no PE card any more.
 */
export type PracticeModuleKey = "fe" | "coding" | "leaderboard"

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
 * - **fe** — number of Final Exam albums (`GET /resources?subjectId=&type=FE` → the page
 *   `total`). FE is no longer listed by the Resource tab, so this is the only surface
 *   that counts it,
 * - **coding** — the SAME challenge bank the Coding module lists
 *   (`GET /api/v1/challenges?subjectId=`), which is where PE papers live now (tagged),
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

            const [fe, views, stats] = await Promise.all([
                examPage(BE_EXAM_TYPE.fe),
                // Không có UUID môn thì KHÔNG hỏi kho. Trước đây chỗ này gọi
                // `listChallenges(undefined)` = cả kho toàn cục, rồi `narrowBankRows`
                // với `null` lại không lọc gì → thẻ "Coding" khoe số bài của MỌI môn,
                // bấm vào thì danh sách (đã thu hẹp đúng môn) rỗng. Đếm 0 là câu trả lời
                // trung thực khi chưa biết môn nào.
                detail?.id
                    ? listChallenges({ subjectId: detail.id }).catch(() => [])
                    : Promise.resolve([]),
                getSubjectStatistics(code).catch(() => null),
            ])
            return [
                { key: "fe", count: fe?.total ?? 0 },
                {
                    key: "coding",
                    // `narrowBankRows` is the transitional belt for a BE that does not
                    // serve `subjectId` yet — otherwise the card would count every
                    // subject's challenges.
                    count: narrowBankRows(
                        toBankRows(views, Date.now()),
                        detail?.id ?? null,
                        [],
                    ).length,
                },
                { key: "leaderboard", count: stats?.leaderboard?.length ?? 0 },
            ]
        },
    )
    return { modules: data ?? [], isLoading, error }
}
