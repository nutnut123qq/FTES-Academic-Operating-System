"use client"

import useSWRMutation from "swr/mutation"
import {
    getPracticeQuiz,
    submitPracticeQuiz,
} from "@/modules/api/rest/subject/subject"
import type { PracticeQuizView } from "@/modules/api/rest/subject/types"
import {
    mapPracticeQuizResult,
    toPracticeAnswers,
    type PracticeQuizResult,
} from "../SubjectPractice/practiceQuizLogic"

/** Argument of a practice draw: which subject and how many questions to pull. */
export interface DrawPracticeQuizArg {
    /** Subject code (the `[subjectId]` route segment, uppercased by the caller). */
    code: string
    /** Requested question count — BE default 10, capped at 50. */
    count?: number
}

/**
 * Draws a fresh practice set.
 *
 * The BE answers `count: 0` + `questions: []` for a subject whose bank has no ready
 * questions — that is an EMPTY STATE, not an error, so it is passed through untouched.
 */
export const drawPracticeQuiz = async (
    arg: DrawPracticeQuizArg,
): Promise<PracticeQuizView> =>
    getPracticeQuiz(arg.code, { count: arg.count })

/** Argument of a practice submit: the drawn questions plus the learner's selections. */
export interface SubmitPracticeQuizArg {
    code: string
    /** The questions as drawn — every one of them is submitted (blank = skipped). */
    questions: PracticeQuizView["questions"]
    /** `questionId → selected option keys`. */
    selections: Record<string, Array<string>>
}

/**
 * Submits a practice attempt and maps the graded response.
 *
 * Grading is entirely server-side: `correctKeys` / `explanation` exist ONLY in this
 * response, so the answer sheet is built from it (see `mapPracticeQuizResult`) and
 * never from a client-side comparison. Nothing is written to the transcript, so a
 * learner can retake freely.
 */
export const submitPracticeAnswers = async (
    arg: SubmitPracticeQuizArg,
): Promise<PracticeQuizResult> => {
    const view = await submitPracticeQuiz(arg.code, {
        answers: toPracticeAnswers(arg.questions, arg.selections),
    })
    return mapPracticeQuizResult(view)
}

/** SWR-mutation wrapper for {@link drawPracticeQuiz}. */
export const useMutateDrawPracticeQuizSwr = () =>
    useSWRMutation<PracticeQuizView, Error, string, DrawPracticeQuizArg>(
        "SUBJECT_PRACTICE_QUIZ_DRAW_SWR",
        async (_key, { arg }) => drawPracticeQuiz(arg),
    )

/** SWR-mutation wrapper for {@link submitPracticeAnswers}. */
export const useMutateSubmitPracticeQuizSwr = () =>
    useSWRMutation<PracticeQuizResult, Error, string, SubmitPracticeQuizArg>(
        "SUBJECT_PRACTICE_QUIZ_SUBMIT_SWR",
        async (_key, { arg }) => submitPracticeAnswers(arg),
    )
