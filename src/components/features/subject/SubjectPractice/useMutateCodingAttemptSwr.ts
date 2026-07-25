"use client"

import useSWRMutation from "swr/mutation"
import { executeCode, gradeCode } from "@/modules/api/rest/ai"
import {
    getChallengeSubmissionResults,
    submitChallenge,
    type SubmissionResultsView,
} from "@/modules/api/rest/challenges"
import {
    normalizeExecution,
    normalizeGrade,
    resolveCodingErrorKey,
    toApiTestCases,
    type CodingAttemptOutcome,
    type CodingOfficialResultRow,
    type CodingSampleCase,
} from "./codingExecution"

/** Everything a Run/Submit needs from the detail panel. */
export interface CodingAttemptArg {
    /** `run` = Judge0 only (no quota, no submission); `submit` = persist + AI grade. */
    kind: "run" | "submit"
    /** Challenge id (UUID) — the submission path segment. */
    challengeId: string
    /** Problem statement handed to the LLM grader (`exercise_question`). */
    exerciseQuestion: string
    code: string
    language: string
    /** Learner-authored sample cases (the BE keeps a challenge's own cases hidden). */
    testCases: Array<CodingSampleCase>
}

/** Maps the challenge-module results payload to the official rows. */
const toOfficialRows = (view: SubmissionResultsView): Array<CodingOfficialResultRow> =>
    (view.results ?? []).map((row, index) => ({
        id: row.testCaseId ?? `official-${index}`,
        name: row.testCaseName ?? "",
        hidden: row.hidden === true,
        passed: row.passed ?? null,
        score: row.score ?? "",
    }))

/**
 * Runs one coding attempt.
 *
 * - `run` → `POST /api/v1/ai/coding/execute-code` (Judge0 only).
 * - `submit` → `POST /api/v1/challenges/{id}/submissions` (payload `CODE`), then
 *   `POST /api/v1/ai/coding/grade-code` for the LLM feedback, then a best-effort read
 *   of `GET /challenges/{id}/submissions/{sid}/results` (the executor may still be
 *   grading — a failure there is swallowed, never surfaced as an attempt failure).
 *
 * A failed grade after a persisted submission is reported through
 * `gradeErrorKey` so the learner still sees the submission went through.
 */
const runCodingAttempt = async (arg: CodingAttemptArg): Promise<CodingAttemptOutcome> => {
    const testCases = toApiTestCases(arg.testCases)

    if (arg.kind === "run") {
        const raw = await executeCode({
            code: arg.code,
            language: arg.language,
            test_cases: testCases,
        })
        return { kind: "run", execution: normalizeExecution(raw) }
    }

    const submission = await submitChallenge(arg.challengeId, {
        payloadType: "CODE",
        code: arg.code,
        language: arg.language,
    })

    const outcome: CodingAttemptOutcome = {
        kind: "submit",
        execution: { rows: [], passedCount: 0, total: 0, supported: true },
        submission: {
            id: submission.id,
            attemptNo: submission.attemptNo,
            status: submission.status,
            finalScore: submission.finalScore ?? null,
        },
    }

    try {
        const graded = await gradeCode({
            exercise_question: arg.exerciseQuestion,
            code: arg.code,
            language: arg.language,
            test_cases: testCases,
            run_code_execution: true,
        })
        const grade = normalizeGrade(graded)
        outcome.grade = grade
        outcome.execution = grade.execution
    } catch (error) {
        outcome.gradeErrorKey = resolveCodingErrorKey(error)
    }

    try {
        const results = await getChallengeSubmissionResults(arg.challengeId, submission.id)
        const rows = toOfficialRows(results)
        if (rows.length > 0) {
            outcome.official = rows
        }
    } catch {
        // The server-side grader is asynchronous (and may be disabled) — a missing
        // results payload is normal right after submit, never an attempt failure.
    }

    return outcome
}

/**
 * SWR mutation wrapper for the Run/Submit buttons of the coding detail panel.
 *
 * @returns `{ attempt, isAttempting, outcome, error, reset }`.
 */
export const useMutateCodingAttemptSwr = () => {
    const { trigger, isMutating, data, error, reset } = useSWRMutation<
        CodingAttemptOutcome,
        Error,
        string,
        CodingAttemptArg
    >("SUBJECT_CODING_ATTEMPT", (_key, { arg }) => runCodingAttempt(arg))

    return {
        attempt: trigger,
        isAttempting: isMutating,
        outcome: data,
        error,
        reset,
    }
}
