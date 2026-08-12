import type { TestCaseVerdict, TestResultView } from "@/modules/api/rest/challenges"

/**
 * The verdicts the judge can report, in the order the BE contract lists them
 * (`challenge-testcase-judge` design §6). Used to narrow the raw payload value.
 */
const TEST_CASE_VERDICTS: Array<TestCaseVerdict> = ["AC", "WA", "TLE", "MLE", "RE", "CE", "SKIPPED"]

/** i18n namespace holding the verdict labels (learn messages). */
const VERDICT_LABEL_PREFIX = "exercises.challenge.testCases.verdict"

/**
 * Narrows a raw `verdict` value coming off the wire to a known {@link TestCaseVerdict}.
 * Anything unknown (a verdict a newer BE added, an empty string, `null` while the case is
 * still grading) yields `null` so the caller can fall back instead of mislabelling the case.
 *
 * @param raw - The `verdict` field as received from the BE.
 * @returns The matching verdict, or `null` when it is absent / unrecognised.
 */
export const normalizeTestCaseVerdict = (
    raw: string | null | undefined,
): TestCaseVerdict | null => {
    const value = (raw ?? "").trim().toUpperCase()
    return TEST_CASE_VERDICTS.find((verdict) => verdict === value) ?? null
}

/**
 * Maps a verdict to the design-system semantic chip color: `AC` reads as success, `WA` as a
 * real failure (danger), `TLE`/`MLE` as a limit warning, and `RE`/`CE`/`SKIPPED` stay neutral
 * (`undefined` → the default muted chip) because they are diagnostics, not answers.
 *
 * @param verdict - A known verdict, or `null` while grading / unrecognised.
 * @returns The HeroUI chip color, or `undefined` for the neutral/muted chip.
 */
export const resolveTestCaseVerdictColor = (
    verdict: TestCaseVerdict | null,
): "success" | "danger" | "warning" | undefined => {
    switch (verdict) {
    case "AC":
        return "success"
    case "WA":
        return "danger"
    case "TLE":
    case "MLE":
        return "warning"
    default:
        return undefined
    }
}

/**
 * Row tint for a verdict — the same semantic family as {@link resolveTestCaseVerdictColor},
 * expressed as a Tailwind token utility (never a hex). Neutral verdicts get no tint.
 *
 * @param verdict - A known verdict, or `null` while grading / unrecognised.
 * @returns The row background class, or an empty string for no tint.
 */
export const resolveTestCaseVerdictRowClass = (verdict: TestCaseVerdict | null): string => {
    switch (resolveTestCaseVerdictColor(verdict)) {
    case "success":
        return "bg-success/5"
    case "danger":
        return "bg-danger/5"
    case "warning":
        return "bg-warning/5"
    default:
        return ""
    }
}

/**
 * The full i18n key of a verdict's learner-facing label.
 *
 * @param verdict - A known verdict.
 * @returns The dotted message key under the `learn` namespace.
 */
export const testCaseVerdictLabelKey = (verdict: TestCaseVerdict): string =>
    `${VERDICT_LABEL_PREFIX}.${verdict}`

/** Aggregate of a submission's per-test-case results. */
export interface TestCaseResultSummary {
    /** How many cases the submission passed. */
    passed: number
    /** How many cases the run covers in total. */
    total: number
    /** How many cases were never executed (`SKIPPED`). */
    skipped: number
    /** True when at least one case was skipped — the grading run stopped early. */
    aborted: boolean
}

/**
 * Tallies the per-case rows for the summary line above the table. A `SKIPPED` case counts
 * toward `total` (the learner should see it exists) but never toward `passed`, and flags the
 * run as aborted so an interrupted grade is not read as a wall of failures.
 *
 * @param results - The per-test-case rows of one submission.
 * @returns The passed/total tally plus the aborted flag.
 */
export const summarizeTestCaseResults = (
    results: Array<TestResultView>,
): TestCaseResultSummary => {
    const skipped = results.filter(
        (result) => normalizeTestCaseVerdict(result.verdict) === "SKIPPED",
    ).length
    return {
        passed: results.filter((result) => result.passed === true).length,
        total: results.length,
        skipped,
        aborted: skipped > 0,
    }
}

/** One case row paired with its 0-based position in the submission's full result list. */
export interface IndexedTestCaseResult {
    /** The row itself, untouched. */
    result: TestResultView
    /** Its original position — the "Test case {n}" fallback for a nameless case. */
    index: number
}

/** Sample rows kept in full, hidden rows folded behind one summary (see {@link groupTestCaseResults}). */
export interface GroupedTestCaseResults {
    /** SAMPLE (`hidden === false`) cases, in payload order — listed row by row. */
    samples: Array<IndexedTestCaseResult>
    /** HIDDEN cases, in payload order — collapsed behind one expandable summary row. */
    hidden: Array<IndexedTestCaseResult>
    /** How many hidden cases passed — the "Test ẩn: X/Y đạt" numerator. */
    hiddenPassed: number
    /** How many hidden cases there are — the denominator (`hidden.length`). */
    hiddenTotal: number
    /** True when at least one hidden case was never executed (`SKIPPED`). */
    hiddenAborted: boolean
}

/**
 * Splits a submission's per-case rows into the two groups the result view renders very
 * differently: SAMPLE cases (the learner already sees their input/expected on the problem
 * side, so each keeps its own detailed row) and HIDDEN cases (up to ~100 of them — folded
 * into ONE summary row that expands to verdicts only). A row with an absent/odd `hidden`
 * flag is treated as HIDDEN: the conservative side, since only an explicit `false` marks a
 * case the BE published as a sample.
 *
 * Pure — it re-groups the rows it is given and reads nothing but `hidden` / `passed` /
 * `verdict`; it never touches (nor could expose) a case's input, expected or captured output,
 * which the learner payload does not carry by contract.
 *
 * @param results - The per-test-case rows of one submission, in the BE's order.
 * @returns The sample rows, the hidden rows and the hidden group's pass tally.
 */
export const groupTestCaseResults = (
    results: Array<TestResultView>,
): GroupedTestCaseResults => {
    const samples: Array<IndexedTestCaseResult> = []
    const hidden: Array<IndexedTestCaseResult> = []
    results.forEach((result, index) => {
        // Only an explicit `false` is a published sample — anything else stays hidden.
        if (result.hidden === false) {
            samples.push({ result, index })
        } else {
            hidden.push({ result, index })
        }
    })
    return {
        samples,
        hidden,
        hiddenPassed: hidden.filter((entry) => entry.result.passed === true).length,
        hiddenTotal: hidden.length,
        hiddenAborted: hidden.some(
            (entry) => normalizeTestCaseVerdict(entry.result.verdict) === "SKIPPED",
        ),
    }
}
