import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — kho challenge của MỘT MÔN không được phép biến thành kho của mọi môn.
 *
 * Triệu chứng thật đã sinh ra file này: đứng ở JPD113, tab Luyện tập treo banner "môn
 * này chưa có challenge riêng" rồi đổ đề PE của CSD201/PRF192 vào. Nguồn duy nhất là
 * nhánh fallback trong hook — hỏi lại kho KHÔNG kèm `subjectId` khi truy vấn theo môn
 * trả 0 dòng. Nhánh đó có HAI đường rơi, và cả hai đều bị ghim ở đây:
 *
 *   (a) môn resolve được nhưng không có bài nào;
 *   (b) `getSubjectDetail` lỗi (404 / mất mạng) — trước đây bị `.catch(() => null)` nuốt.
 *
 * Ghim thêm một điều dễ bị "dọn dẹp" mất: {@link narrowBankRows} KHÔNG phải fallback,
 * nó là đai chặn chiều ngược lại (BE cũ bỏ qua param thì cả kho tràn về). Từ khi banner
 * bị gỡ, mất đai này là sai IM LẶNG.
 */

vi.mock("@/modules/api/rest/challenges", () => ({ listChallenges: vi.fn() }))
vi.mock("@/modules/api/rest/subject", () => ({ getSubjectDetail: vi.fn() }))

import type { ChallengeView } from "@/modules/api/rest/challenges"
import { listChallenges } from "@/modules/api/rest/challenges"
import { getSubjectDetail } from "@/modules/api/rest/subject"
import type { SubjectDetail } from "@/modules/api/rest/subject"
import {
    fetchSubjectCodingBank,
    narrowBankRows,
    toBankRows,
} from "./useQuerySubjectCodingChallengesSwr"

const JPD113 = "11111111-1111-1111-1111-111111111111"
const CSD201 = "22222222-2222-2222-2222-222222222222"

/** Một dòng challenge như BE trả về (chỉ các field mapping đọc mới quan trọng). */
const view = (
    id: string,
    subjectId: string | null,
    tags: Array<string> = [],
): ChallengeView =>
    ({
        id,
        slug: id,
        title: id.toUpperCase(),
        description: "",
        type: "CODING",
        mode: "INDIVIDUAL",
        status: "PUBLISHED",
        subjectId,
        startsAt: null,
        endsAt: null,
        maxSubmissions: 3,
        submissionCount: 0,
        courseId: null,
        tags: tags.map((slug) => ({ slug, label: slug })),
    }) as unknown as ChallengeView

/** Môn resolve được, mang UUID thật. */
const subject = (id: string): SubjectDetail => ({ id }) as unknown as SubjectDetail

describe("fetchSubjectCodingBank", () => {
    beforeEach(() => {
        vi.mocked(getSubjectDetail).mockReset()
        vi.mocked(listChallenges).mockReset()
    })

    it("hỏi kho ĐÚNG MỘT LẦN, luôn kèm subjectId của môn", async () => {
        vi.mocked(getSubjectDetail).mockResolvedValue(subject(JPD113))
        vi.mocked(listChallenges).mockResolvedValue([view("jpd-1", JPD113)])

        const bank = await fetchSubjectCodingBank("JPD113", [])

        expect(bank.items.map((item) => item.id)).toEqual(["jpd-1"])
        expect(vi.mocked(listChallenges)).toHaveBeenCalledTimes(1)
        expect(vi.mocked(listChallenges)).toHaveBeenCalledWith({
            subjectId: JPD113,
            tags: [],
        })
    })

    it("môn chưa có bài nào → trả RỖNG, không hỏi lại kho toàn cục", async () => {
        vi.mocked(getSubjectDetail).mockResolvedValue(subject(JPD113))
        // Truy vấn theo môn trả rỗng. Nếu có ai hỏi lại mà bỏ `subjectId` thì mock này
        // sẽ đưa nguyên đề của CSD201 sang — đúng cái đã hiện trên màn hình thật.
        vi.mocked(listChallenges).mockImplementation(async (params) =>
            params?.subjectId === JPD113 ? [] : [view("csd-1", CSD201, ["pe", "csd201"])],
        )

        const bank = await fetchSubjectCodingBank("JPD113", [])

        expect(bank.items).toEqual([])
        expect(vi.mocked(listChallenges)).toHaveBeenCalledTimes(1)
        expect(
            vi.mocked(listChallenges).mock.calls.every(([params]) => params?.subjectId),
        ).toBe(true)
    })

    it("giữ nguyên tag đã chọn khi hỏi kho (AND phía server)", async () => {
        vi.mocked(getSubjectDetail).mockResolvedValue(subject(JPD113))
        vi.mocked(listChallenges).mockResolvedValue([])

        await fetchSubjectCodingBank("JPD113", ["pe"])

        expect(vi.mocked(listChallenges)).toHaveBeenCalledWith({
            subjectId: JPD113,
            tags: ["pe"],
        })
    })

    it("đọc môn hỏng → NÉM lỗi lên SWR, không lặng lẽ chiếu kho toàn cục", async () => {
        vi.mocked(getSubjectDetail).mockRejectedValue(
            Object.assign(new Error("HTTP 404"), { status: 404 }),
        )
        vi.mocked(listChallenges).mockResolvedValue([view("csd-1", CSD201)])

        await expect(fetchSubjectCodingBank("JPD113", [])).rejects.toThrow("HTTP 404")
        expect(vi.mocked(listChallenges)).not.toHaveBeenCalled()
    })

    it("môn trả về không có UUID → cũng ném lỗi, tuyệt đối không hỏi kho bỏ trống subjectId", async () => {
        vi.mocked(getSubjectDetail).mockResolvedValue({} as unknown as SubjectDetail)
        vi.mocked(listChallenges).mockResolvedValue([view("csd-1", CSD201)])

        await expect(fetchSubjectCodingBank("JPD113", [])).rejects.toThrow(/without an id/)
        expect(vi.mocked(listChallenges)).not.toHaveBeenCalled()
    })

    it("BE cũ bỏ qua param subjectId → đai narrowBankRows vẫn cắt đề môn khác", async () => {
        vi.mocked(getSubjectDetail).mockResolvedValue(subject(JPD113))
        // deployment cũ: nhận param nhưng trả nguyên cả kho
        vi.mocked(listChallenges).mockResolvedValue([
            view("jpd-1", JPD113),
            view("csd-1", CSD201, ["pe", "csd201"]),
            view("prf-1", null),
        ])

        const bank = await fetchSubjectCodingBank("JPD113", [])

        expect(bank.items.map((item) => item.id)).toEqual(["jpd-1"])
    })
})

describe("narrowBankRows", () => {
    it("là đai chặn chiều 'kho tràn vào', KHÔNG phải fallback — đừng xoá", () => {
        const rows = toBankRows(
            [view("jpd-1", JPD113, ["pe"]), view("csd-1", CSD201, ["pe"])],
            Date.now(),
        )

        expect(narrowBankRows(rows, JPD113, ["pe"]).map((row) => row.id)).toEqual(["jpd-1"])
        // AND semantics: thiếu một slug là rớt
        expect(narrowBankRows(rows, JPD113, ["pe", "jpd113"])).toEqual([])
    })
})
