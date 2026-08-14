import React from "react"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"
import vi_messages from "@/messages/vi.json"
import en_messages from "@/messages/en.json"
import type { CodingChallenge } from "../hooks/useQuerySubjectCodingChallengesSwr"

/**
 * Component — CÂU CHỮ mà người học/giảng viên đọc khi trang Luyện tập của môn trống rỗng.
 *
 * Đây là câu duy nhất xuất hiện đúng lúc cần chỉ đúng chỗ hỏng, nên nó không được chỉ sai
 * chỗ. Danh sách bài của môn được thu hẹp bằng CỘT `challenges.subject_id` (mã môn → UUID →
 * `listChallenges({ subjectId })`, rồi `narrowBankRows` so `item.subjectId`), KHÔNG phải
 * bằng tag. Tag mã môn chỉ phục vụ Ô LỌC TAG.
 *
 * Bản cũ nói "Bài của môn được gắn theo mã môn." → dẫn người đọc đi gắn tag mã môn cho
 * challenge; làm xong bài VẪN không hiện vì `subject_id` vẫn NULL. Tệ hơn, gắn tag `pe` còn
 * đẩy bài DRAFT sang hàng chờ duyệt. Nên bài test này ghim HÀNH VI của câu chữ chứ không
 * ghim nguyên văn: câu hint không được trình bày tag là cơ chế quyết định bài thuộc môn nào,
 * và phải nói rõ gắn tag KHÔNG đủ.
 *
 * Dùng catalog vi/en THẬT (không echo key) — chính chữ người dùng đọc mới là thứ cần ghim.
 */

vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children }: { href: string; children?: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}))

const { useQuerySubjectCodingChallengesSwr } = vi.hoisted(() => ({
    useQuerySubjectCodingChallengesSwr: vi.fn(),
}))
vi.mock("../hooks/useQuerySubjectCodingChallengesSwr", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useQuerySubjectCodingChallengesSwr,
}))

import { CodingChallengeList } from "./CodingChallengeList"

/** Kho rỗng THẬT (đã đọc xong, không lỗi) → màn hình rơi vào nhánh "môn chưa có bài". */
const emptyBank = () => ({
    challenges: [] as Array<CodingChallenge>,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
})

/**
 * Render danh sách bằng catalog thật rồi trả về TOÀN BỘ chữ của khối rỗng (tiêu đề + hint),
 * lấy neo là tiêu đề `emptySubject` — khoá không nằm trong phạm vi sửa, nên dùng nó làm mốc
 * mà không ghim nguyên văn câu hint.
 */
const emptyBlockText = (locale: "vi" | "en"): string => {
    const messages = locale === "vi" ? vi_messages : en_messages
    render(
        <NextIntlClientProvider locale={locale} messages={messages}>
            <CodingChallengeList subjectId="JPD113" onBack={() => {}} />
        </NextIntlClientProvider>,
    )
    const title = screen.getByText(messages.subjects.practice.coding.emptySubject)
    return title.parentElement?.textContent ?? ""
}

beforeEach(() => {
    useQuerySubjectCodingChallengesSwr.mockReset()
    useQuerySubjectCodingChallengesSwr.mockReturnValue(emptyBank())
})

describe("Trang môn trống — câu hint phải chỉ đúng cơ chế", () => {
    it("vi: KHÔNG được nói bài thuộc môn nhờ 'gắn theo mã môn'", () => {
        const text = emptyBlockText("vi")
        expect(text).not.toMatch(/g[ắa]n theo m[ãa] m[ôo]n/i)
    })

    it("en: KHÔNG được nói bài thuộc môn 'by its code'", () => {
        const text = emptyBlockText("en")
        expect(text).not.toMatch(/belong to a subject by its code/i)
    })

    it("vi: phải nói rõ chỉ gắn tag là KHÔNG đủ", () => {
        const text = emptyBlockText("vi")
        expect(text).toMatch(/tag/i)
        expect(text).toMatch(/kh[ôo]ng/i)
    })

    it("en: phải nói rõ chỉ gắn tag là KHÔNG đủ", () => {
        const text = emptyBlockText("en")
        expect(text).toMatch(/tag/i)
        expect(text).toMatch(/\bnot\b/i)
    })
})
