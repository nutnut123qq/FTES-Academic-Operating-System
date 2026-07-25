"use client"

import { submitQuizJob } from "@/modules/api/rest/ai"
import {
    isCorrectQuizOption,
    type QuizResult,
} from "@/components/features/ai-platform/tools/types"

import { useSubjectAiJob } from "./useSubjectAiJob"

/** A single generated multiple-choice question, normalized for client grading. */
export interface SubjectAiQuizQuestion {
    /** Stable per-run id (index-derived — the worker sends no ids). */
    id: string
    /** The question stem. */
    prompt: string
    /** Option labels; index matches {@link answerIndex}. */
    options: Array<string>
    /**
     * Index of the correct option, or `-1` when the worker's `correct` matched no
     * option (a degraded generation). The surface must NOT mark anything correct in
     * that case rather than silently blaming option 0.
     */
    answerIndex: number
    /** Why the answer is right, revealed after grading. */
    explanation?: string
}

/** A graded-ready quiz plus the model that produced it. */
export interface SubjectAiQuiz {
    questions: Array<SubjectAiQuizQuestion>
    model?: string
}

/** Args for a quiz run. */
export interface GenerateSubjectQuizArgs {
    /** Resource UUID picked in the source list (BE `resourceId`). */
    resourceId: string
    /** How many questions to generate (BE `questionCount`). */
    count: number
    /** UI locale forwarded as the generation language. */
    language: string
}

/**
 * Normalizes a raw `QUIZ_GEN` job result into locally gradable questions.
 *
 * The worker maps ftes-ai-service onto `{questions:[{question, options, correct,
 * explanation}], model}`, where `correct` is a 0-based index, a letter, or the exact
 * option text — {@link isCorrectQuizOption} resolves all three, so the answer is
 * folded into an `answerIndex` ONCE here instead of re-deriving it per click.
 * Questions with no options are dropped (nothing to answer).
 *
 * @param raw - the parsed job result, or undefined before the job COMPLETED.
 */
export const mapQuizJobResult = (
    raw: QuizResult | string | undefined,
): SubjectAiQuiz => {
    if (!raw || typeof raw === "string") return { questions: [] }
    const questions = (raw.questions ?? [])
        .filter((question) => Array.isArray(question?.options) && question.options.length > 0)
        .map((question, index) => ({
            id: `q${index + 1}`,
            prompt: question.question ?? "",
            options: question.options,
            answerIndex: question.options.findIndex((option, optionIndex) =>
                isCorrectQuizOption(question.correct, optionIndex, option),
            ),
            explanation: question.explanation?.trim() || undefined,
        }))
    return { questions, model: raw.model }
}

/**
 * Runs the REAL quiz job for a picked subject resource: `POST /ai/learning/quiz`
 * with `{resourceId, questionCount, language}` → poll `GET /ai/jobs/{id}` → hand back
 * normalized questions. Grading stays client-side (no BE round-trip per answer).
 */
export const useMutateSubjectAiQuizSwr = () => {
    const job = useSubjectAiJob<QuizResult | string>()

    /** Submit a quiz job for the picked resource. */
    const generate = (args: GenerateSubjectQuizArgs) =>
        void job.run(() =>
            submitQuizJob({
                resourceId: args.resourceId,
                questionCount: args.count,
                language: args.language,
            }),
        )

    const quiz = mapQuizJobResult(job.result)

    return {
        ...job,
        generate,
        questions: quiz.questions,
        model: quiz.model,
    }
}
