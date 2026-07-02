"use client"

import useSWRMutation from "swr/mutation"

/** A single generated multiple-choice question. */
export interface SubjectAiQuizQuestion {
    id: string
    prompt: string
    /** Option labels; index matches `answerIndex`. */
    options: Array<string>
    /** Index of the correct option. */
    answerIndex: number
}

/** Args for a quiz generation. */
export interface GenerateQuizArgs {
    subjectCode: string
    sourceTitle: string
    /** Number of questions to generate. */
    count: number
    /** Force the mock failure path (retry testing). */
    fail?: boolean
}

/** ~1.1s so the generation loading state is observable. */
const MOCK_DELAY_MS = 1100

// ponytail: mock BE — no quiz endpoint. Builds `count` source-aware MCQs with a
// deterministic correct option so FE grading works.
const generateQuizMock = async (
    _key: string,
    { arg }: { arg: GenerateQuizArgs },
): Promise<Array<SubjectAiQuizQuestion>> => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
    if (arg.fail) {
        throw new Error("mock-quiz-failure")
    }
    return Array.from({ length: arg.count }, (_, i) => {
        const answerIndex = i % 4
        return {
            id: `q${i + 1}`,
            prompt:
                `Câu ${i + 1} — ${arg.subjectCode}: theo "${arg.sourceTitle}", ` +
                "đâu là phát biểu đúng? (câu hỏi demo)",
            options: [
                "Phương án A",
                "Phương án B",
                "Phương án C",
                "Phương án D",
            ],
            answerIndex,
        }
    })
}

/**
 * Generates a mock MCQ quiz from a picked subject source. SWR-mutation-shaped for
 * a drop-in BE swap. BE assumption (logged): a real BE generates + returns the
 * quiz for the (subject, source, count).
 *
 * @param subjectId - the `[subjectId]` route segment (scopes the SWR key).
 */
export const useMutateSubjectAiQuizSwr = (subjectId: string) => {
    return useSWRMutation<
        Array<SubjectAiQuizQuestion>,
        Error,
        string,
        GenerateQuizArgs
    >(`subject-ai-quiz:${subjectId}`, generateQuizMock)
}
