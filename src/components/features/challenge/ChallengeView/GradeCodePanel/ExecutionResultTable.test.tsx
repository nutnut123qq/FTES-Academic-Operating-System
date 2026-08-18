import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { CodeExecutionSummary } from "@/modules/api/rest/ai"

/**
 * Component — {@link ExecutionResultTable} với case ẨN (change run-all-test-cases).
 *
 * Nút "Chạy test" nay chạy TOÀN BỘ bộ test của đề, nên phần lớn dòng là case học viên không được
 * đọc. Hai thứ phải cùng đúng, và đây là chỗ ghim: dòng ẩn vẫn nói rõ ĐẠT/TRƯỢT (không thì chạy đủ
 * bộ test cũng chẳng cho học viên biết gì để sửa), nhưng KHÔNG được lộ input/expected/actual.
 *
 * `t` echo lại key nên trạng thái phân biệt được qua key nào được render.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params && "omitted" in params ? `${key}#${params.omitted}` : key,
}))

vi.mock("@heroui/react", () => ({
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    CheckCircleIcon: () => <i />,
    XCircleIcon: () => <i />,
    LockSimpleIcon: () => <i />,
}))

const { ExecutionResultTable } = await import("./ExecutionResultTable")

/** Một lượt chạy đủ bộ: 1 case mẫu đạt + 1 case ẩn TRƯỢT (server đã gỡ dữ liệu của case ẩn). */
const summary: CodeExecutionSummary = {
    passed: 1,
    total: 2,
    results: [
        {
            input: "1 2",
            expected: "3",
            actual: "3",
            passed: true,
            status_label: "Accepted",
            hidden: false,
        },
        {
            // Đúng hình dạng BE trả về cho case ẩn: không input/expected/actual/stderr.
            passed: false,
            status_label: "Wrong Answer",
            hidden: true,
        },
    ],
}

describe("ExecutionResultTable — case ẩn", () => {
    it("hiện đủ số dòng của cả bộ test, không chỉ case mẫu", () => {
        render(<ExecutionResultTable summary={summary} />)

        expect(screen.getAllByRole("row")).toHaveLength(3) // 1 header + 2 case
    })

    it("case ẩn vẫn nói rõ TRƯỢT — đó là thứ học viên cần", () => {
        render(<ExecutionResultTable summary={summary} />)

        expect(screen.queryByText("codeGrading.testFail")).not.toBeNull()
        expect(screen.queryByText("Wrong Answer")).not.toBeNull()
    })

    it("case ẩn KHÔNG lộ input/expected/actual", () => {
        render(<ExecutionResultTable summary={summary} />)

        // Ba ô của dòng ẩn đều là nhãn "đã ẩn", không phải ô trống (ô trống đọc như "case không
        // có input" — một sự thật khác hẳn).
        expect(screen.getAllByText("codeGrading.testHidden")).toHaveLength(3)
        expect(screen.queryByText("codeGrading.testHiddenTag")).not.toBeNull()
    })

    it("case mẫu giữ nguyên dữ liệu", () => {
        render(<ExecutionResultTable summary={summary} />)

        expect(screen.queryByText("1 2")).not.toBeNull()
        expect(screen.queryByText("Accepted")).not.toBeNull()
    })

    it("bộ test bị trần cắt thì nói ra, không im lặng", () => {
        render(<ExecutionResultTable summary={{ ...summary, truncated: true, omitted: 10 }} />)

        expect(screen.queryByText("codeGrading.testTruncated#10")).not.toBeNull()
    })

    it("backend cũ (không có cờ hidden) đọc như case mẫu — không che nhầm", () => {
        render(<ExecutionResultTable summary={{
            passed: 1,
            total: 1,
            results: [{ input: "1 2", expected: "3", actual: "3", passed: true }],
        }} />)

        expect(screen.queryByText("codeGrading.testHidden")).toBeNull()
        expect(screen.queryByText("1 2")).not.toBeNull()
    })
})
