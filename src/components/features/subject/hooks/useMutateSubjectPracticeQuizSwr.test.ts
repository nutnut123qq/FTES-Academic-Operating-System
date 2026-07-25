import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the practice-quiz REST edge.
 *
 * Pinned: a draw asks for the requested count, a submit sends EVERY drawn question
 * (blank ones included, so the BE still returns their answer + explanation) and the
 * caller gets the mapped SERVER grading — the client never scores an answer.
 */

vi.mock("@/modules/api/rest/subject/subject", () => ({
    getPracticeQuiz: vi.fn(),
    submitPracticeQuiz: vi.fn(),
}))

import { getPracticeQuiz, submitPracticeQuiz } from "@/modules/api/rest/subject/subject"
import type { PracticeQuizResultView, PracticeQuizView } from "@/modules/api/rest/subject/types"
import { drawPracticeQuiz, submitPracticeAnswers } from "./useMutateSubjectPracticeQuizSwr"

const questions: PracticeQuizView["questions"] = [
    {
        id: "q1",
        question: "1 + 1 = ?",
        type: "SINGLE_CHOICE",
        options: [
            { key: "A", text: "1" },
            { key: "B", text: "2" },
        ],
        points: 1,
        difficulty: "EASY",
    },
    {
        id: "q2",
        question: "Chọn các số chẵn",
        type: "MULTIPLE_CHOICE",
        options: [
            { key: "A", text: "2" },
            { key: "B", text: "3" },
        ],
        points: 1,
        difficulty: "EASY",
    },
]

describe("drawPracticeQuiz", () => {
    beforeEach(() => {
        vi.mocked(getPracticeQuiz).mockReset()
        vi.mocked(submitPracticeQuiz).mockReset()
    })

    it("passes the requested count and passes an empty bank straight through", async () => {
        vi.mocked(getPracticeQuiz).mockResolvedValue({
            subjectCode: "CS101",
            count: 0,
            questions: [],
        })

        const view = await drawPracticeQuiz({ code: "CS101", count: 20 })

        expect(getPracticeQuiz).toHaveBeenCalledWith("CS101", { count: 20 })
        // an empty bank is an empty state, not a thrown error
        expect(view.questions).toEqual([])
    })
})

describe("submitPracticeAnswers", () => {
    beforeEach(() => {
        vi.mocked(submitPracticeQuiz).mockReset()
    })

    it("submits every question and maps the graded response", async () => {
        const graded: PracticeQuizResultView = {
            subjectCode: "CS101",
            totalQuestions: 2,
            answeredQuestions: 1,
            correctCount: 1,
            earnedPoints: 1,
            totalPoints: 2,
            scorePercent: "50.00",
            results: [
                {
                    questionId: "q1",
                    question: "1 + 1 = ?",
                    type: "SINGLE_CHOICE",
                    options: [
                        { key: "A", text: "1" },
                        { key: "B", text: "2" },
                    ],
                    selectedKeys: ["B"],
                    correctKeys: ["B"],
                    correct: true,
                    points: 1,
                    earnedPoints: 1,
                    explanation: "Cộng cơ bản.",
                },
                {
                    questionId: "q2",
                    question: "Chọn các số chẵn",
                    type: "MULTIPLE_CHOICE",
                    options: [
                        { key: "A", text: "2" },
                        { key: "B", text: "3" },
                    ],
                    selectedKeys: [],
                    correctKeys: ["A"],
                    correct: false,
                    points: 1,
                    earnedPoints: 0,
                    explanation: null,
                },
            ],
        }
        vi.mocked(submitPracticeQuiz).mockResolvedValue(graded)

        const result = await submitPracticeAnswers({
            code: "CS101",
            questions,
            selections: { q1: ["B"] },
        })

        expect(submitPracticeQuiz).toHaveBeenCalledWith("CS101", {
            answers: [
                { questionId: "q1", selectedKeys: ["B"] },
                { questionId: "q2", selectedKeys: [] },
            ],
        })
        expect(result.scorePercent).toBe(50)
        expect(result.questions[0]).toMatchObject({
            correct: true,
            explanation: "Cộng cơ bản.",
        })
        expect(result.questions[0].options[1].state).toBe("correct")
        // the skipped question still comes back with its correct key revealed
        expect(result.questions[1].answered).toBe(false)
        expect(result.questions[1].options[0].state).toBe("missed")
    })
})
