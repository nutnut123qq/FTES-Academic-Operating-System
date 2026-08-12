import { describe, expect, it } from "vitest"
import type { TestResultView } from "@/modules/api/rest/challenges"
import {
    groupTestCaseResults,
    normalizeTestCaseVerdict,
    resolveTestCaseVerdictColor,
    resolveTestCaseVerdictRowClass,
    summarizeTestCaseResults,
    testCaseVerdictLabelKey,
} from "./test-case-verdict"

/**
 * Pure mapper — verdict → semantic token / label key / tally (challenge-testcase-results 2.2,
 * 2.3). Contract: `challenge-testcase-judge` design §6 (AC · WA · TLE · MLE · RE · CE · SKIPPED).
 */

/** Minimal per-case row; only the fields the mapper reads matter. */
const row = (over: Partial<TestResultView>): TestResultView => ({
    testCaseId: "tc-1",
    testCaseName: "case",
    hidden: false,
    passed: null,
    score: "0",
    ...over,
})

describe("normalizeTestCaseVerdict", () => {
    it("narrows every known verdict, case-insensitively and trimmed", () => {
        expect(normalizeTestCaseVerdict("AC")).toBe("AC")
        expect(normalizeTestCaseVerdict(" tle ")).toBe("TLE")
        expect(normalizeTestCaseVerdict("skipped")).toBe("SKIPPED")
    })

    it("returns null while grading or for a verdict this build does not know", () => {
        expect(normalizeTestCaseVerdict(null)).toBeNull()
        expect(normalizeTestCaseVerdict(undefined)).toBeNull()
        expect(normalizeTestCaseVerdict("")).toBeNull()
        expect(normalizeTestCaseVerdict("OLE")).toBeNull()
    })
})

describe("resolveTestCaseVerdictColor / RowClass", () => {
    it("maps AC to success, WA to danger, the limit verdicts to warning", () => {
        expect(resolveTestCaseVerdictColor("AC")).toBe("success")
        expect(resolveTestCaseVerdictColor("WA")).toBe("danger")
        expect(resolveTestCaseVerdictColor("TLE")).toBe("warning")
        expect(resolveTestCaseVerdictColor("MLE")).toBe("warning")
    })

    it("keeps diagnostics and the unknown/grading case neutral (muted chip)", () => {
        expect(resolveTestCaseVerdictColor("RE")).toBeUndefined()
        expect(resolveTestCaseVerdictColor("CE")).toBeUndefined()
        expect(resolveTestCaseVerdictColor("SKIPPED")).toBeUndefined()
        expect(resolveTestCaseVerdictColor(null)).toBeUndefined()
    })

    it("tints the row with the matching semantic token, never a hex", () => {
        expect(resolveTestCaseVerdictRowClass("AC")).toBe("bg-success/5")
        expect(resolveTestCaseVerdictRowClass("WA")).toBe("bg-danger/5")
        expect(resolveTestCaseVerdictRowClass("TLE")).toBe("bg-warning/5")
        expect(resolveTestCaseVerdictRowClass("CE")).toBe("")
        expect(resolveTestCaseVerdictRowClass(null)).toBe("")
    })
})

describe("testCaseVerdictLabelKey", () => {
    it("points at the learn message namespace", () => {
        expect(testCaseVerdictLabelKey("MLE")).toBe("exercises.challenge.testCases.verdict.MLE")
    })
})

describe("summarizeTestCaseResults", () => {
    it("counts passed out of total and reports a complete run as not aborted", () => {
        const summary = summarizeTestCaseResults([
            row({ passed: true, verdict: "AC" }),
            row({ passed: false, verdict: "WA" }),
            row({ passed: true, verdict: "AC" }),
        ])
        expect(summary).toEqual({ passed: 2, total: 3, skipped: 0, aborted: false })
    })

    it("flags an aborted run and never counts a skipped case as passed", () => {
        const summary = summarizeTestCaseResults([
            row({ passed: true, verdict: "AC" }),
            row({ passed: false, verdict: "TLE" }),
            row({ passed: null, verdict: "SKIPPED" }),
            row({ passed: null, verdict: "SKIPPED" }),
        ])
        expect(summary).toEqual({ passed: 1, total: 4, skipped: 2, aborted: true })
    })

    it("handles an older payload with no verdict at all", () => {
        const summary = summarizeTestCaseResults([row({ passed: true }), row({ passed: false })])
        expect(summary).toEqual({ passed: 1, total: 2, skipped: 0, aborted: false })
    })
})

describe("groupTestCaseResults", () => {
    it("lists sample cases individually and folds the hidden ones into one tally", () => {
        const grouped = groupTestCaseResults([
            row({ testCaseId: "s1", hidden: false, passed: true, verdict: "AC" }),
            row({ testCaseId: "h1", hidden: true, passed: true, verdict: "AC" }),
            row({ testCaseId: "s2", hidden: false, passed: false, verdict: "WA" }),
            row({ testCaseId: "h2", hidden: true, passed: false, verdict: "TLE" }),
            row({ testCaseId: "h3", hidden: true, passed: true, verdict: "AC" }),
        ])
        expect(grouped.samples.map((entry) => entry.result.testCaseId)).toEqual(["s1", "s2"])
        expect(grouped.hidden.map((entry) => entry.result.testCaseId)).toEqual(["h1", "h2", "h3"])
        expect(grouped.hiddenPassed).toBe(2)
        expect(grouped.hiddenTotal).toBe(3)
        expect(grouped.hiddenAborted).toBe(false)
    })

    it("keeps each row's ORIGINAL position so a nameless case keeps its number", () => {
        const grouped = groupTestCaseResults([
            row({ hidden: true }),
            row({ hidden: false }),
            row({ hidden: true }),
            row({ hidden: false }),
        ])
        expect(grouped.samples.map((entry) => entry.index)).toEqual([1, 3])
        expect(grouped.hidden.map((entry) => entry.index)).toEqual([0, 2])
    })

    it("flags a hidden group whose run stopped early", () => {
        const grouped = groupTestCaseResults([
            row({ hidden: true, passed: true, verdict: "AC" }),
            row({ hidden: true, passed: null, verdict: "SKIPPED" }),
        ])
        expect(grouped.hiddenPassed).toBe(1)
        expect(grouped.hiddenTotal).toBe(2)
        expect(grouped.hiddenAborted).toBe(true)
    })

    it("treats an absent hidden flag as HIDDEN — only an explicit false is a sample", () => {
        // An older payload that omits `hidden` entirely must never be published as a sample.
        const legacy = {
            testCaseId: "legacy",
            testCaseName: null,
            passed: true,
            score: "1",
        } as unknown as TestResultView
        const grouped = groupTestCaseResults([legacy, row({ hidden: false })])
        expect(grouped.hiddenTotal).toBe(1)
        expect(grouped.samples).toHaveLength(1)
    })

    it("handles the all-hidden and all-sample extremes", () => {
        const allHidden = groupTestCaseResults([row({ hidden: true }), row({ hidden: true })])
        expect(allHidden.samples).toEqual([])
        expect(allHidden.hiddenTotal).toBe(2)

        const allSamples = groupTestCaseResults([row({ hidden: false })])
        expect(allSamples.hidden).toEqual([])
        expect(allSamples.hiddenTotal).toBe(0)
        expect(allSamples.hiddenPassed).toBe(0)

        expect(groupTestCaseResults([])).toEqual({
            samples: [],
            hidden: [],
            hiddenPassed: 0,
            hiddenTotal: 0,
            hiddenAborted: false,
        })
    })
})
