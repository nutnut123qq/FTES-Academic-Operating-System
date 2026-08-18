import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link GradeResultCard} when the score belongs to somebody else.
 *
 * A submission graded by test cases now ALWAYS gets an AI review (BE change
 * `challenge-testcase-ai-review`), and that review carries a score of its own. Rendered as-is, a
 * learner who passed every test case reads a second, lower number right underneath the judge's
 * table with nothing saying which one counts.
 *
 * `t` echoes the key, so the two states are told apart by which key was rendered.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params && "score" in params ? `${key}#${params.score}` : key,
}))

vi.mock("@heroui/react", () => ({
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
}))

const { GradeResultCard } = await import("./GradeResultCard")

const result = {
    score: 40,
    max: 100,
    verdict: "FAIL",
    model: "vclaw:claude-sonnet-4-6",
    feedback: "Vòng lặp lồng nhau khiến độ phức tạp là O(n^2).",
} as never

describe("GradeResultCard", () => {
    it("hiện điểm như bình thường khi AI là đường chấm điểm", () => {
        render(<GradeResultCard result={result} />)

        expect(screen.queryByText("codeGrading.score#40")).not.toBeNull()
        expect(screen.queryByText("codeGrading.reviewTitle")).toBeNull()
    })

    it("bài chấm bằng test case: KHÔNG hiện điểm của AI, nói rõ điểm ở đâu ra", () => {
        render(<GradeResultCard result={result} scoreOwnedByTests />)

        expect(screen.queryByText("codeGrading.score#40")).toBeNull()
        expect(screen.queryByText("codeGrading.reviewTitle")).not.toBeNull()
        expect(screen.queryByText("codeGrading.reviewScoreNote")).not.toBeNull()
    })

    it("giữ nguyên phần nhận xét — đó mới là thứ học viên vào đây để đọc", () => {
        render(<GradeResultCard result={result} scoreOwnedByTests />)

        expect(screen.queryByText(/O\(n\^2\)/)).not.toBeNull()
    })
})
