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
 * Ranh giới "được phép degrade" nằm ở chỗ đọc đó có phải TIỀN ĐỀ hay không:
 * - **đọc môn** (`getSubjectDetail`) và **đọc kho challenge** đều NÉM lên SWR. Không đọc
 *   được môn thì không biết đang nói về môn nào, nên mọi con số đều vô nghĩa; còn kho
 *   challenge là đúng lượt đọc mà {@link import("./useQuerySubjectCodingChallengesSwr")}
 *   dùng cho danh sách bài. Hai bề mặt cạnh nhau (thẻ "Coding" và danh sách bài) KHÔNG
 *   được nói ngược nhau về cùng một lượt đọc,
 * - **FE albums** và **leaderboard** vẫn best-effort: chúng auth-gated / có thể rỗng thật,
 *   và hỏng một cái chỉ làm mờ ĐÚNG con số của nó, không kéo theo cả hub.
 */
export const useQuerySubjectPracticeSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-practice", code] as const) : null,
        async (): Promise<Array<PracticeModule>> => {
            // KHÔNG `.catch(() => null)` ở đây. Nuốt lỗi đọc môn rồi trả count = 0 là đổi
            // "không đọc được môn" thành "môn có 0 bài" — đúng câu nói dối mà hook challenge
            // đã bị cấm nói. 0 là một con số KHẲNG ĐỊNH, không phải "chưa biết". Ném lên để
            // SWR có `error`, màn hình hiện lỗi + nút Thử lại.
            const detail = await getSubjectDetail(code)
            if (!detail?.id) {
                throw new Error(`Subject ${code} resolved without an id`)
            }
            // The resource list keys on the subject UUID; a failed FE read degrades that
            // one count to 0 instead of failing the hub.
            const examPage = (type: string) =>
                listResources({
                    subjectId: detail.id,
                    type,
                    size: EXAM_COUNT_PROBE,
                }).catch(() => null)

            const [fe, views, stats] = await Promise.all([
                examPage(BE_EXAM_TYPE.fe),
                // Luôn kèm `subjectId`. Trước đây chỗ này gọi `listChallenges(undefined)`
                // = cả kho toàn cục, rồi `narrowBankRows` với `null` lại không lọc gì →
                // thẻ "Coding" khoe số bài của MỌI môn, bấm vào thì danh sách (đã thu hẹp
                // đúng môn) rỗng.
                // BEST-EFFORT CÓ CHỦ ĐÍCH, đừng "sửa" thành ném:
                // GET /api/v1/challenges là endpoint CHỈ CHO NGƯỜI ĐÃ ĐĂNG NHẬP
                // (SecurityConfig kết bằng anyRequest().authenticated()), trong khi trang môn
                // là PUBLIC (SubjectPublicSecurityConfig permitAll). Để nó ném lên SWR thì
                // khách CHƯA đăng nhập mở /subjects/{code}/practice sẽ mất TOÀN BỘ hub — thay
                // bằng "Không tải được" + nút Thử lại mà bấm bao nhiêu lần cũng 401, và không
                // một chữ nào gợi ý đăng nhập. Thà thẻ Coding đếm 0 cho khách còn hơn khoá cả
                // lối vào FE/Bảng xếp hạng. Đọc MÔN thì vẫn ném (ở trên) — không đọc được môn
                // là hỏng thật, khác hẳn "chưa đăng nhập nên không thấy kho bài".
                listChallenges({ subjectId: detail.id }).catch(() => []),
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
                        detail.id,
                        [],
                    ).length,
                },
                { key: "leaderboard", count: stats?.leaderboard?.length ?? 0 },
            ]
        },
    )
    return { modules: data ?? [], isLoading, error, mutate }
}
