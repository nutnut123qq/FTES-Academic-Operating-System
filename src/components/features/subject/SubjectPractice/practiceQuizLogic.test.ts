import { describe, expect, it } from "vitest"

/**
 * Unit — the practice-quiz mapping.
 *
 * The tab used to be a dead "coming soon" handoff; it now draws from
 * `GET /subjects/{code}/practice/quiz` and grades through `POST …/quiz/submit`. The
 * contract pinned here is that the ANSWER SHEET IS THE RESPONSE: `correct`,
 * `correctKeys`, `explanation`, `earnedPoints` and `scorePercent` are read off the
 * payload, never recomputed by comparing selections client-side.
 */

import {
    isSingleChoiceQuestion,
    mapPracticeQuizResult,
    toPracticeAnswers,
    toggleSelection,
} from "./practiceQuizLogic"
import type { PracticeQuizResultView } from "@/modules/api/rest/subject/types"

const result: PracticeQuizResultView = {
    subjectCode: "CS101",
    totalQuestions: 3,
    answeredQuestions: 2,
    correctCount: 1,
    earnedPoints: 2,
    totalPoints: 6,
    // BigDecimal → arrives as a decimal string
    scorePercent: "33.33",
    results: [
        {
            questionId: "q1",
            question: "Độ phức tạp của tìm kiếm nhị phân?",
            type: "SINGLE_CHOICE",
            options: [
                { key: "A", text: "O(n)" },
                { key: "B", text: "O(log n)" },
            ],
            selectedKeys: ["B"],
            correctKeys: ["B"],
            correct: true,
            points: 2,
            earnedPoints: 2,
            explanation: "Mỗi bước loại một nửa dữ liệu.",
        },
        {
            questionId: "q2",
            question: "Chọn các cấu trúc LIFO",
            type: "MULTIPLE_CHOICE",
            options: [
                { key: "A", text: "Stack" },
                { key: "B", text: "Queue" },
                { key: "C", text: "Call stack" },
            ],
            selectedKeys: ["A"],
            correctKeys: ["A", "C"],
            // the BE counts a partial multi-answer as WRONG — the client must not disagree
            correct: false,
            points: 2,
            earnedPoints: 0,
            explanation: null,
        },
        {
            questionId: "q3",
            question: "HTTP là giao thức phi trạng thái?",
            type: "TRUE_FALSE",
            options: [
                { key: "T", text: "Đúng" },
                { key: "F", text: "Sai" },
            ],
            selectedKeys: [],
            correctKeys: ["T"],
            correct: false,
            points: 2,
            earnedPoints: 0,
            explanation: "Mỗi request độc lập.",
        },
    ],
}

describe("mapPracticeQuizResult", () => {
    it("takes the score and the verdicts from the response", () => {
        const mapped = mapPracticeQuizResult(result)

        expect(mapped.scorePercent).toBe(33)
        expect(mapped.correctCount).toBe(1)
        expect(mapped.answeredQuestions).toBe(2)
        expect(mapped.earnedPoints).toBe(2)
        expect(mapped.totalPoints).toBe(6)
        expect(mapped.questions.map((question) => question.correct)).toEqual([
            true,
            false,
            false,
        ])
    })

    it("labels each option from the submitted selection vs the returned correct keys", () => {
        const [single, multiple, skipped] = mapPracticeQuizResult(result).questions

        expect(single.options.map((option) => option.state)).toEqual(["neutral", "correct"])
        // picked A (right), missed C, never picked B (wrong)
        expect(multiple.options.map((option) => option.state)).toEqual([
            "correct",
            "neutral",
            "missed",
        ])
        expect(skipped.options.map((option) => option.state)).toEqual(["missed", "neutral"])
    })

    it("keeps a partially-answered multi question WRONG, as the BE graded it", () => {
        const multiple = mapPracticeQuizResult(result).questions[1]

        // every selected key is correct, yet the response says false → trust the response
        expect(multiple.selectedKeys.every((key) => multiple.correctKeys.includes(key))).toBe(true)
        expect(multiple.correct).toBe(false)
        expect(multiple.earnedPoints).toBe(0)
        expect(multiple.multiple).toBe(true)
    })

    it("marks a blank question as unanswered and carries its explanation through", () => {
        const [first, , skipped] = mapPracticeQuizResult(result).questions

        expect(skipped.answered).toBe(false)
        expect(skipped.explanation).toBe("Mỗi request độc lập.")
        expect(first.answered).toBe(true)
        expect(mapPracticeQuizResult(result).questions[1].explanation).toBeNull()
    })
})

describe("toPracticeAnswers", () => {
    it("submits EVERY drawn question, blanks included", () => {
        const questions = [
            { id: "q1", question: "", type: "SINGLE_CHOICE", options: [], points: 1, difficulty: "EASY" },
            { id: "q2", question: "", type: "MULTIPLE_CHOICE", options: [], points: 1, difficulty: "EASY" },
        ]

        expect(toPracticeAnswers(questions, { q1: ["A"] })).toEqual([
            { questionId: "q1", selectedKeys: ["A"] },
            { questionId: "q2", selectedKeys: [] },
        ])
    })
})

describe("toggleSelection", () => {
    it("replaces the pick for single-choice / true-false and accumulates for multi", () => {
        expect(toggleSelection(["A"], "B", "SINGLE_CHOICE")).toEqual(["B"])
        expect(toggleSelection(["T"], "F", "TRUE_FALSE")).toEqual(["F"])
        expect(toggleSelection(["A"], "B", "MULTIPLE_CHOICE")).toEqual(["A", "B"])
        expect(toggleSelection(["A", "B"], "A", "MULTIPLE_CHOICE")).toEqual(["B"])
        // tapping the same radio again clears it (a skipped question stays possible)
        expect(toggleSelection(["A"], "A", "SINGLE_CHOICE")).toEqual([])
        expect(isSingleChoiceQuestion("TRUE_FALSE")).toBe(true)
        expect(isSingleChoiceQuestion("MULTIPLE_CHOICE")).toBe(false)
    })
})
