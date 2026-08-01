/**
 * Pure mapping helpers for the coding-practice Run / Submit flow.
 *
 * The Run button hits `POST /api/v1/ai/coding/execute-code` and Submit hits
 * `POST /api/v1/challenges/{id}/submissions` + `POST /api/v1/ai/coding/grade-code`.
 * Both AI endpoints are a verbatim pass-through of `ftes-ai-service /v2/code/*`, whose
 * real payload is FLAT (`{supported, results[], passed, total}`) while the shared FE
 * client type wraps it in `{ execution }` (grade responses really do wrap it). These
 * helpers read BOTH shapes so neither side can break the panel, and they never invent
 * a pass/fail — a row is `passed` only when the backend says so.
 */
import { RestError } from "@/modules/api/rest/client"

/** One normalized test-case row rendered under the editor. */
export interface CodingRunRow {
    /** Stable row key (`case-{index}`) — the backend rows carry no id. */
    id: string
    input: string
    expected: string
    actual: string
    /** Judge0 verdict, e.g. `Accepted` / `Wrong Answer` / `Compilation Error`. */
    status: string
    passed: boolean
    /** Compiler / runtime stderr, when the backend reports one. */
    stderr?: string
    /** Wall-clock seconds reported by Judge0, when present. */
    time?: number
}

/** Normalized execution block (Judge0) of a run/grade response. */
export interface CodingExecutionOutcome {
    rows: Array<CodingRunRow>
    passedCount: number
    total: number
    /**
     * `false` when the backend could not execute the language (e.g. SQL / an
     * unsupported runtime) — the UI must then say "not executed", not "failed".
     */
    supported: boolean
}

/**
 * Program streams of a flat sandbox `execute-code` run (PIN §7.1:
 * `{stdout, stderr, exit_code, time_ms, compile_output}`). Surfaced when the BE returns
 * the new sandbox shape instead of a Judge0 test-case block, so a Run still shows the
 * program's output instead of a "no cases" placeholder.
 */
export interface CodingRunOutput {
    stdout: string
    stderr: string
    compileOutput: string
    /** Process exit code, or `null` when the payload omits it. */
    exitCode: number | null
    /** Wall-clock milliseconds, or `null` when the payload omits it. */
    timeMs: number | null
    /** True when the response carried any sandbox stream (vs a test-case-only block). */
    present: boolean
}

/** One LLM-graded criterion row of a grade-code response. */
export interface CodingGradeCriterion {
    name: string
    score: number
    max: number
    comment: string
}

/** Normalized AI grade block (`POST /ai/coding/grade-code`). */
export interface CodingGradeOutcome {
    score: number
    max: number
    /** `PASS` | `PARTIAL` | `FAIL` (verbatim from the backend). */
    verdict: string
    criteria: Array<CodingGradeCriterion>
    feedback: string
    improvements: Array<string>
    /** The model that graded — MUST be surfaced (each model scores differently). */
    model: string
    modelNote: string
    /** Judge0 block attached to the grade, when the language is executable. */
    execution: CodingExecutionOutcome
}

/** The Run/Submit outcome shown under the editor. */
export interface CodingAttemptOutcome {
    /** `run` = Judge0 only; `submit` = challenge submission + AI grade. */
    kind: "run" | "submit"
    execution: CodingExecutionOutcome
    /** Present on submit only. */
    grade?: CodingGradeOutcome | null
    /** The persisted submission (challenge module), present on submit only. */
    submission?: CodingSubmissionSummary | null
    /**
     * Program streams from the new flat sandbox `execute-code` response (PIN §7.1).
     * Present on a `run` when the BE returns the sandbox shape (`{stdout, stderr,
     * exit_code, time_ms}`) instead of a Judge0 test-case block — the panel then shows
     * the program output so a Run is never silently empty.
     */
    runOutput?: CodingRunOutput
    /**
     * Set when the submission was persisted but the AI grade failed — the panel keeps
     * the submission block and shows this error key instead of dropping everything.
     */
    gradeErrorKey?: string
    /** Server-side test results for the submission, when the grader already ran. */
    official?: Array<CodingOfficialResultRow>
}

/** One server-side (challenge module) test result row. */
export interface CodingOfficialResultRow {
    id: string
    name: string
    /** Hidden cases never expose input/expected — only the verdict. */
    hidden: boolean
    /** `null` while the executor is still grading. */
    passed: boolean | null
    score: string
}

/** Compact view of the persisted challenge submission. */
export interface CodingSubmissionSummary {
    id: string
    attemptNo: number
    /** `PENDING` | `GRADING` | `COMPLETED` … (verbatim). */
    status: string
    /** Final score as returned (string decimal) or `null` while grading. */
    finalScore: string | null
}

/** An empty (nothing-executed) block — the safe default for every unreadable payload. */
export const EMPTY_EXECUTION: CodingExecutionOutcome = {
    rows: [],
    passedCount: 0,
    total: 0,
    supported: true,
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null

const asText = (value: unknown): string => {
    if (value === null || value === undefined) {
        return ""
    }
    return typeof value === "string" ? value : String(value)
}

const asNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value
    }
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
        return Number(value)
    }
    return undefined
}

/**
 * Normalizes the Judge0 execution block of a run/grade response.
 *
 * Accepts the flat ai-service shape (`{supported, results, passed, total}`), the
 * wrapped shape (`{execution: {...}}`) and `null`/garbage (→ {@link EMPTY_EXECUTION}).
 *
 * @param raw - the response body as returned by the REST client.
 * @returns rows plus the passed/total counters, recomputed from the rows when the
 * backend omits them.
 */
export const normalizeExecution = (raw: unknown): CodingExecutionOutcome => {
    const root = asRecord(raw)
    if (!root) {
        return EMPTY_EXECUTION
    }
    // grade-code wraps the block; execute-code returns it flat.
    const block = asRecord(root.execution) ?? root
    const results = Array.isArray(block.results) ? block.results : []

    const rows: Array<CodingRunRow> = results.map((entry, index) => {
        const item = asRecord(entry) ?? {}
        const stderr = asText(item.stderr)
        const time = asNumber(item.time)
        return {
            id: `case-${index}`,
            input: asText(item.input),
            expected: asText(item.expected ?? item.output),
            actual: asText(item.actual),
            status: asText(item.status),
            passed: item.passed === true,
            ...(stderr ? { stderr } : {}),
            ...(time === undefined ? {} : { time }),
        }
    })

    const passedFromRows = rows.filter((row) => row.passed).length
    const passed = asNumber(block.passed)
    const total = asNumber(block.total)

    return {
        rows,
        passedCount: passed ?? passedFromRows,
        total: total ?? rows.length,
        supported: block.supported !== false,
    }
}

/**
 * Extracts the flat sandbox streams of an `execute-code` response (PIN §7.1:
 * `{stdout, stderr, exit_code, time_ms, compile_output}`).
 *
 * `present` is true only when the payload actually carried a stream field, so the panel
 * can distinguish the new sandbox shape (show program output) from a Judge0 test-case
 * block or garbage (fall back to the test-case rows / "no cases"). The old flat Judge0
 * shape (`{supported, results, passed, total}`) carries none of these keys → `present:
 * false`, leaving the existing test-case rendering untouched.
 *
 * @param raw - the response body as returned by the REST client.
 */
export const normalizeRunOutput = (raw: unknown): CodingRunOutput => {
    const root = asRecord(raw) ?? {}
    const present =
        "stdout" in root
        || "stderr" in root
        || "exit_code" in root
        || "compile_output" in root
        || "time_ms" in root
    return {
        stdout: asText(root.stdout),
        stderr: asText(root.stderr),
        compileOutput: asText(root.compile_output),
        exitCode: asNumber(root.exit_code) ?? null,
        timeMs: asNumber(root.time_ms) ?? null,
        present,
    }
}

/**
 * Normalizes a `grade-code` response into the block the panel renders.
 *
 * @param raw - the grade response body.
 * @returns score/verdict/criteria/feedback plus the nested execution block.
 */
export const normalizeGrade = (raw: unknown): CodingGradeOutcome => {
    const root = asRecord(raw) ?? {}
    const criteriaRaw = Array.isArray(root.criteria) ? root.criteria : []
    const improvementsRaw = Array.isArray(root.improvements) ? root.improvements : []

    return {
        score: asNumber(root.score) ?? 0,
        max: asNumber(root.max) ?? 10,
        verdict: asText(root.verdict),
        criteria: criteriaRaw.map((entry) => {
            const item = asRecord(entry) ?? {}
            return {
                name: asText(item.name),
                score: asNumber(item.score) ?? 0,
                max: asNumber(item.max) ?? 0,
                comment: asText(item.comment),
            }
        }),
        feedback: asText(root.feedback),
        improvements: improvementsRaw.map((entry) => asText(entry)).filter((line) => line !== ""),
        model: asText(root.model),
        modelNote: asText(root.model_note),
        execution: normalizeExecution(root),
    }
}

/** A learner-authored sample case (the BE hides a challenge's real test cases). */
export interface CodingSampleCase {
    id: string
    input: string
    expected: string
}

/**
 * Converts the learner's sample rows into the snake_case `test_cases` the AI
 * endpoints expect, dropping rows where both fields are blank.
 *
 * @param cases - the editable sample rows.
 * @returns `[{input, output}]` (possibly empty → the backend just runs the code).
 */
export const toApiTestCases = (
    cases: Array<CodingSampleCase>,
): Array<{ input: string; output: string }> =>
    cases
        .filter((item) => item.input.trim() !== "" || item.expected.trim() !== "")
        .map((item) => ({ input: item.input, output: item.expected }))

/**
 * Maps a failed Run/Submit to an i18n key suffix under
 * `subjects.practice.coding.errors.*`.
 *
 * Timeouts arrive as a bare axios error (the REST client only wraps responses in a
 * {@link RestError}), so they are detected on `code`/`message`.
 *
 * @param error - whatever the client threw.
 * @returns the message key suffix (`generic` when nothing matches).
 */
export const resolveCodingErrorKey = (error: unknown): string => {
    if (error instanceof RestError) {
        switch (error.errorCode) {
            case "CHALLENGE_MAX_SUBMISSIONS":
                return "maxSubmissions"
            case "CHALLENGE_NOT_OPEN":
            case "CHALLENGE_INVALID_STATE":
                return "notOpen"
            case "CHALLENGE_COURSE_ACCESS_DENIED":
                return "courseLocked"
            case "AI_CODE_DOWN":
                return "unavailable"
            case "AI_CODE_EXECUTION_ERROR":
                return "executionFailed"
            default:
                break
        }
        if (error.status === 401) return "unauthorized"
        if (error.status === 403) return "forbidden"
        if (error.status === 404) return "notFound"
        if (error.status === 429) return "rateLimited"
        if (error.status === 503) return "unavailable"
        if (error.status === 502 || error.status === 504) return "executionFailed"
        return "generic"
    }

    const code = (error as { code?: string } | null)?.code
    const message = error instanceof Error ? error.message : ""
    if (code === "ECONNABORTED" || code === "ETIMEDOUT" || /timeout/i.test(message)) {
        return "timeout"
    }
    if (code === "ERR_NETWORK") {
        return "network"
    }
    return "generic"
}
