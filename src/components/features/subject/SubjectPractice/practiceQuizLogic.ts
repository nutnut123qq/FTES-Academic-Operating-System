import { RestError } from "@/modules/api/rest/client"
import type {
    PracticeAnswerInput,
    PracticeQuestionView,
    PracticeQuizResultView,
} from "@/modules/api/rest/subject/types"

/**
 * Pure helpers for the subject practice quiz
 * (`GET/POST /api/v1/subjects/{code}/practice/quiz`).
 *
 * The BE grades server-side and only the SUBMIT response carries `correctKeys` /
 * `explanation` — the served questions deliberately do not. Everything here therefore
 * maps what came back; nothing re-grades an answer on the client.
 */

/** Question types whose answer is exactly one key (radio); everything else is multi. */
export const isSingleChoiceQuestion = (type: string): boolean =>
    type !== "MULTIPLE_CHOICE"

/**
 * Builds the submit body from the drawn questions and the learner's selections.
 * EVERY drawn question is sent — an unanswered one goes up with an empty
 * `selectedKeys` so the BE counts it as skipped and still returns its correct answer
 * and explanation in the result.
 */
export const toPracticeAnswers = (
    questions: ReadonlyArray<PracticeQuestionView>,
    selections: Readonly<Record<string, Array<string>>>,
): Array<PracticeAnswerInput> =>
    questions.map((question) => ({
        questionId: question.id,
        selectedKeys: selections[question.id] ?? [],
    }))

/** Toggles one option key inside the current selection, honouring the question type. */
export const toggleSelection = (
    current: ReadonlyArray<string>,
    key: string,
    type: string,
): Array<string> => {
    if (isSingleChoiceQuestion(type)) {
        return current.includes(key) ? [] : [key]
    }
    return current.includes(key)
        ? current.filter((existing) => existing !== key)
        : [...current, key]
}

/** How one option ended up, used to colour the reviewed answer sheet. */
export type PracticeOptionState = "correct" | "incorrect" | "missed" | "neutral"

/** One option of a graded question. */
export interface PracticeResultOption {
    key: string
    text: string
    /** The learner picked this option. */
    selected: boolean
    /** The BE flagged this option as (one of) the correct answer(s). */
    isCorrect: boolean
    /** `correct` picked-right · `incorrect` picked-wrong · `missed` right-but-skipped. */
    state: PracticeOptionState
}

/** One graded question — all verdict data comes from the submit response. */
export interface PracticeResultQuestion {
    id: string
    question: string
    type: string
    /** True for `MULTIPLE_CHOICE` (checkboxes). */
    multiple: boolean
    options: Array<PracticeResultOption>
    selectedKeys: Array<string>
    correctKeys: Array<string>
    /** The BE verdict — never recomputed from the keys. */
    correct: boolean
    /** False when the learner left the question blank. */
    answered: boolean
    points: number
    earnedPoints: number
    explanation: string | null
}

/** The whole graded attempt, ready to render. */
export interface PracticeQuizResult {
    subjectCode: string
    totalQuestions: number
    answeredQuestions: number
    correctCount: number
    earnedPoints: number
    totalPoints: number
    /** Rounded percentage (the BE sends a `BigDecimal`, so it can arrive as a string). */
    scorePercent: number
    questions: Array<PracticeResultQuestion>
}

/**
 * Maps the BE submit payload onto the answer sheet.
 *
 * Contract pinned here: the verdicts (`correct`, `correctKeys`, `explanation`,
 * `earnedPoints`, `scorePercent`) are TAKEN from the response — the client never
 * grades, so a BE that counts a partially-selected multi-answer as wrong stays the
 * single source of truth.
 */
export const mapPracticeQuizResult = (
    result: PracticeQuizResultView,
): PracticeQuizResult => {
    const questions = (result.results ?? []).map((row) => {
        const selectedKeys = row.selectedKeys ?? []
        const correctKeys = row.correctKeys ?? []
        const options = (row.options ?? []).map((option) => {
            const selected = selectedKeys.includes(option.key)
            const isCorrect = correctKeys.includes(option.key)
            const state: PracticeOptionState = selected
                ? isCorrect
                    ? "correct"
                    : "incorrect"
                : isCorrect
                    ? "missed"
                    : "neutral"
            return { key: option.key, text: option.text, selected, isCorrect, state }
        })
        return {
            id: row.questionId,
            question: row.question,
            type: row.type,
            multiple: !isSingleChoiceQuestion(row.type),
            options,
            selectedKeys,
            correctKeys,
            correct: row.correct === true,
            answered: selectedKeys.length > 0,
            points: row.points ?? 0,
            earnedPoints: row.earnedPoints ?? 0,
            explanation: row.explanation ?? null,
        }
    })

    return {
        subjectCode: result.subjectCode,
        totalQuestions: result.totalQuestions ?? questions.length,
        answeredQuestions: result.answeredQuestions ?? 0,
        correctCount: result.correctCount ?? 0,
        earnedPoints: result.earnedPoints ?? 0,
        totalPoints: result.totalPoints ?? 0,
        scorePercent: Math.round(Number(result.scorePercent ?? 0)),
        questions,
    }
}

/**
 * Maps any practice failure onto an i18n key under `subjects.practice.errors.*`.
 *
 * Practice is authenticated (progress belongs to a learner), so `401` is a real,
 * expected branch — not a generic crash.
 */
export const resolvePracticeErrorKey = (error: unknown): string => {
    if (error instanceof RestError) {
        if (error.errorCode === "SUBJECT_PRACTICE_INVALID") return "invalid"
        if (error.status === 401) return "unauthorized"
        if (error.status === 403) return "forbidden"
        if (error.status === 404) return "notFound"
        if (error.status === 409) return "conflict"
        if (error.status === 429) return "rateLimited"
        if (error.status === 503) return "unavailable"
        return "generic"
    }
    const code = (error as { code?: string } | null)?.code
    const message = error instanceof Error ? error.message : ""
    if (code === "ECONNABORTED" || code === "ETIMEDOUT" || /timeout/i.test(message)) {
        return "timeout"
    }
    if (code === "ERR_NETWORK") return "network"
    return "generic"
}
