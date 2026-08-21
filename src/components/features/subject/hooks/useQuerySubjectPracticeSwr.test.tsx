import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PracticeModule } from "./useQuerySubjectPracticeSwr"

/**
 * Unit — fetcher của {@link useQuerySubjectPracticeSwr} (thẻ đếm của Practice hub).
 *
 * Nguyên tắc mà hook challenge đã đặt ra và hook này phải theo: **"không đọc được môn"
 * KHÁC "môn không có bài"**. `0` là một con số KHẲNG ĐỊNH, không phải "chưa biết" — nuốt
 * lỗi đọc môn rồi trả count = 0 chỉ là đổi một câu nói dối lấy một câu nói dối khác, và
 * còn làm hai bề mặt cạnh nhau nói ngược nhau về CÙNG một lượt đọc (thẻ "Coding" bảo
 * "0 bài" trong khi danh sách bài bảo "không tải được").
 *
 * `swr` bị mock để bắt lấy cặp `(key, fetcher)` rồi gọi thẳng fetcher — không phải chờ
 * vòng đời SWR, nên khẳng định "fetcher NÉM" là khẳng định về đúng thứ SWR sẽ nhận.
 *
 * Ranh giới còn lại vẫn giữ: FE albums là đọc auth-gated, hỏng thì chỉ mờ ĐÚNG con số của
 * nó chứ không kéo cả hub xuống.
 */

type SwrCall = { key: unknown; fetcher: (() => unknown) | undefined }

const swrCalls: Array<SwrCall> = []

vi.mock("swr", () => ({
    default: (key: unknown, fetcher: (() => unknown) | undefined) => {
        swrCalls.push({ key, fetcher })
        return { data: undefined, error: undefined, isLoading: false, mutate: vi.fn() }
    },
}))

const getSubjectDetail = vi.fn()
const listResources = vi.fn()
const listChallenges = vi.fn()

// `@/modules/api/rest/subject` chỉ `export * from "./subject"`; hook đọc `getSubjectDetail`
// qua index, mock luôn cả module thật để không lệ thuộc vào lối import.
vi.mock("@/modules/api/rest/subject/subject", () => ({
    getSubjectDetail: (...a: Array<unknown>) => getSubjectDetail(...a),
}))
vi.mock("@/modules/api/rest/subject", () => ({
    getSubjectDetail: (...a: Array<unknown>) => getSubjectDetail(...a),
    // Kho thẻ ghi nhớ (8d39a49b) thêm lời gọi này vào hook nhưng mock ở đây không có
    // ⇒ vitest ném "No export is defined on the mock" và ĐỎ TOÀN BỘ file test, chặn mọi
    // PR của repo. Mock là factory nên nó phải khai ĐỦ mọi export hook đụng tới; thêm một
    // lời gọi vào hook thì phải thêm vào đây cùng lúc.
    // Trả null = nhánh best-effort của hook (khách chưa đăng nhập), nên bộ ca cũ giữ
    // nguyên ý nghĩa: thẻ flashcards đếm 0, phần còn lại của hub không đổi.
    getSubjectFlashcards: () => Promise.resolve(null),
}))
vi.mock("@/modules/api/rest/resource", () => ({
    listResources: (...a: Array<unknown>) => listResources(...a),
}))
vi.mock("@/modules/api/rest/challenges", () => ({
    listChallenges: (...a: Array<unknown>) => listChallenges(...a),
}))

import { useQuerySubjectPracticeSwr } from "./useQuerySubjectPracticeSwr"

/** Chạy fetcher mà SWR sẽ chạy, cho mã môn của route. */
const runFetcher = (): Promise<Array<PracticeModule>> => {
    renderHook(() => useQuerySubjectPracticeSwr("jpd113"))
    const { fetcher } = swrCalls[swrCalls.length - 1]
    return Promise.resolve(fetcher?.()) as Promise<Array<PracticeModule>>
}

/** Một dòng challenge BE tối thiểu, đã thuộc đúng môn. */
const view = (id: string) => ({
    id,
    slug: id,
    title: id,
    description: "",
    type: "CODING",
    mode: "INDIVIDUAL",
    status: "PUBLISHED",
    subjectId: "uuid-jpd113",
    startsAt: null,
    endsAt: null,
    maxSubmissions: 1,
    submissionCount: 0,
    courseId: null,
    tags: [],
})

beforeEach(() => {
    swrCalls.length = 0
    getSubjectDetail.mockReset()
    listResources.mockReset()
    listChallenges.mockReset()
    getSubjectDetail.mockResolvedValue({ id: "uuid-jpd113" })
    listResources.mockResolvedValue({ total: 4 })
    listChallenges.mockResolvedValue([view("c1"), view("c2"), view("c3")])
})

describe("useQuerySubjectPracticeSwr", () => {
    it("đọc môn HỎNG thì NÉM lên SWR, không trình bày thành 'môn có 0 bài'", async () => {
        getSubjectDetail.mockRejectedValue(new Error("404 subject"))
        await expect(runFetcher()).rejects.toThrow()
        // và tuyệt đối không được hỏi kho khi chưa biết môn nào (hỏi trống = cả kho toàn cục)
        expect(listChallenges).not.toHaveBeenCalled()
    })

    it("môn trả về KHÔNG có UUID cũng là 'chưa biết', không phải 'không có bài'", async () => {
        getSubjectDetail.mockResolvedValue({ id: null })
        await expect(runFetcher()).rejects.toThrow()
        expect(listChallenges).not.toHaveBeenCalled()
    })

    it("đọc kho challenge hỏng thì thẻ Coding về 0 — KHÔNG được khoá cả hub", async () => {
        // GET /api/v1/challenges chỉ cho người ĐÃ đăng nhập, còn trang môn là PUBLIC. Nếu để
        // lượt đọc này ném lên SWR thì khách chưa đăng nhập mất TOÀN BỘ hub (kể cả lối vào FE
        // vốn đọc được), thay bằng một nút "Thử lại" mà bấm mãi vẫn 401.
        // Thẻ Coding hiện 0 là cái giá rẻ hơn nhiều — và đúng với thứ khách được phép thấy.
        listChallenges.mockRejectedValue(new Error("401 challenges"))
        const modules = await runFetcher()
        expect(modules).toEqual([
            { key: "fe", count: 4 },
            { key: "flashcards", count: 0 },
            { key: "coding", count: 0 },
        ])
    })

    it("đọc được thì đếm bài của ĐÚNG môn, và luôn hỏi kho kèm UUID môn", async () => {
        const modules = await runFetcher()
        expect(listChallenges).toHaveBeenCalledWith({ subjectId: "uuid-jpd113" })
        expect(modules).toEqual([
            { key: "fe", count: 4 },
            { key: "flashcards", count: 0 },
            { key: "coding", count: 3 },
        ])
    })

    it("chỉ đếm bài mang đúng subjectId của môn (đai chắn BE cũ bỏ qua param)", async () => {
        listChallenges.mockResolvedValue([
            view("c1"),
            { ...view("c2"), subjectId: "uuid-csd201" },
            { ...view("c3"), subjectId: null },
        ])
        const modules = await runFetcher()
        expect(modules.find((m) => m.key === "coding")?.count).toBe(1)
    })

    it("FE albums vẫn best-effort: hỏng thì mờ ĐÚNG số của nó, hub vẫn sống", async () => {
        listResources.mockRejectedValue(new Error("401"))
        const modules = await runFetcher()
        expect(modules).toEqual([
            { key: "fe", count: 0 },
            { key: "flashcards", count: 0 },
            { key: "coding", count: 3 },
        ])
    })
})
