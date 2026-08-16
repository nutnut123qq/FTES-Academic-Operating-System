"use client"

import useSWR from "swr"
import { RestError } from "@/modules/api/rest/client"
import { getCareerSkillCategories, getMyCareerSkillExp } from "@/modules/api/rest/career"
import { buildSkillExpChart, type SkillExpChartData } from "./skillExpModel"

// The view-model types + the mapping helpers live in `skillExpModel` (pure, unit
// tested); they are re-exported here so every consumer keeps a single import path.
export * from "./skillExpModel"

/**
 * Lỗi của `GET /career/me/skill-exp` có được phép NUỐT (rơi về danh mục chung ở 0) hay không.
 *
 * Chỉ ba mã dưới đây là "người này không có bộ EXP để đọc", tức một SỰ THẬT về quyền chứ không phải
 * hỏng hóc:
 * - `401` khách chưa đăng nhập (career nằm sau platform auth),
 * - `403` đăng nhập rồi nhưng không có quyền career,
 * - `404` bản BE chưa deploy endpoint này.
 *
 * MỌI thứ còn lại — 5xx, timeout, mạng đứt (`status = 0`), token hết hạn giữa chừng — là HỎNG và
 * phải nổi lên thành lỗi SWR. Đây đúng là lớp bug cả đợt này sinh ra để diệt: `catch(() => [])` nuốt
 * tất, người đang có 1.200 EXP gặp một cú 500 sẽ thấy biểu đồ đủ cột toàn số 0 kèm câu "chưa có EXP,
 * học đi rồi cộng" — không nút Thử lại, và không cách nào biết mình đang nhìn dữ liệu hỏng.
 *
 * @param cause - thứ mà lời gọi REST ném ra.
 * @returns `true` khi được phép rơi về danh mục chung.
 */
export const isSkillExpReadUnavailable = (cause: unknown): boolean =>
    cause instanceof RestError
    && (cause.status === 401 || cause.status === 403 || cause.status === 404)

/**
 * Đọc hai payload career rồi dựng view model của biểu đồ.
 *
 * Tách ra khỏi hook (thay vì fetcher inline) để test được thẳng phần quyết định NUỐT hay NÉM mà
 * không cần dựng SWR.
 *
 * @returns view model đã dựng.
 * @throws lỗi đọc danh mục, hoặc lỗi đọc EXP học viên KHÔNG thuộc nhóm dung thứ.
 */
export const loadSkillExpChart = async (): Promise<SkillExpChartData> => {
    const [categories, learner] = await Promise.all([
        getCareerSkillCategories(),
        getMyCareerSkillExp().then(
            (payload) => ({ payload: payload as unknown, unavailable: false }),
            (cause: unknown) => {
                if (!isSkillExpReadUnavailable(cause)) {
                    throw cause
                }
                // Rỗng ở đây là "không đọc được", KHÔNG phải "đọc được và chưa có gì" — cờ thứ hai
                // giữ đúng sự khác biệt đó xuống tới tầng model.
                return { payload: [] as unknown, unavailable: true }
            },
        ),
    ])
    return buildSkillExpChart(categories ?? [], learner.payload, learner.unavailable)
}

/**
 * Loads the learner's skill set and their EXP in it (changes `course-skill-exp` and
 * `default-skills-by-major`).
 *
 * - `GET /api/v1/career/me/skill-exp` → the default skill set of the learner's MAJOR
 *   plus their real EXP per category (zeros included). This drives which bars exist.
 * - `GET /api/v1/career/skill-categories` → the managed catalogue, consulted only for
 *   display labels and as the stand-in bucket list when the learner read is missing.
 *
 * Failure handling, and why the two reads are NOT treated alike: a catalogue that cannot be
 * read surfaces as the SWR `error` so the section shows its retryable ERROR state, while the
 * learner read is tolerated ONLY for the three "you have nothing to read" codes
 * ({@link isSkillExpReadUnavailable}) — and even then the degradation is FLAGGED
 * (`chart.learnerReadUnavailable`) instead of being passed off as an empty result. An error must
 * never be dressed up as "you have not earned anything yet" — those are different facts and the
 * reader has to be able to tell which one they are looking at.
 *
 * @returns `{ chart, isLoading, error, mutate }` — `mutate` re-runs the fetch.
 */
export const useQuerySkillExpSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["skill-exp"] as const, loadSkillExpChart)

    return { chart: data, isLoading, error, mutate }
}
