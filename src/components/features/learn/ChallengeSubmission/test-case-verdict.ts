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
