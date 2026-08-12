import { describe, expect, it } from "vitest"
import { resolveAiFeedbackAllowance, resolveChallengeLimitParts } from "./challenge-limits"

/**
 * Pure mappers — the reported resource limits and the AI-feedback allowance
 * (challenge-samples-and-limits 3.1 / 3.2). Contract: BE `challenge-testcase-samples`
 * (`timeLimitMs`/`memoryLimitMb` = max across the test cases, null when there are none;
 * `aiFeedbackLimit` default 1, clamped 1..5; `aiFeedbackUsed` counted from stored results).
 */

describe("resolveChallengeLimitParts", () => {
    it("reads a whole-second budget as seconds and keeps memory in MB", () => {
        expect(resolveChallengeLimitParts(2000, 256)).toEqual([
            { kind: "timeSeconds", value: 2 },
            { kind: "memoryMb", value: 256 },
        ])
    })

    it("keeps a non-round time budget in milliseconds", () => {
        expect(resolveChallengeLimitParts(1500, null)).toEqual([{ kind: "timeMs", value: 1500 }])
    })

    it("renders nothing when the backend reports no limits", () => {
        expect(resolveChallengeLimitParts(null, null)).toEqual([])
        expect(resolveChallengeLimitParts(undefined, undefined)).toEqual([])
    })

    it("drops a non-positive or non-finite value instead of showing a fake budget", () => {
        expect(resolveChallengeLimitParts(0, 0)).toEqual([])
        expect(resolveChallengeLimitParts(-1000, Number.NaN)).toEqual([])
    })

    it("still reports memory when only the memory limit is known", () => {
        expect(resolveChallengeLimitParts(null, 512)).toEqual([{ kind: "memoryMb", value: 512 }])
    })
})

describe("resolveAiFeedbackAllowance", () => {
    it("reports what is left of the mentor's allowance", () => {
        expect(resolveAiFeedbackAllowance(3, 1)).toEqual({
            limit: 3,
            used: 1,
            remaining: 2,
            exhausted: false,
        })
    })

    it("flags an exhausted allowance without ever going negative", () => {
        expect(resolveAiFeedbackAllowance(1, 1)).toEqual({
            limit: 1,
            used: 1,
            remaining: 0,
            exhausted: true,
        })
        // A lowered limit / an extra BE-side count must not produce "-2 lượt".
        expect(resolveAiFeedbackAllowance(2, 4)).toEqual({
            limit: 2,
            used: 2,
            remaining: 0,
            exhausted: true,
        })
    })

    it("treats an unknown used count as none spent", () => {
        expect(resolveAiFeedbackAllowance(2, null)).toEqual({
            limit: 2,
            used: 0,
            remaining: 2,
            exhausted: false,
        })
        expect(resolveAiFeedbackAllowance(2, undefined)?.remaining).toBe(2)
    })

    it("says nothing at all when the backend reports no usable limit", () => {
        expect(resolveAiFeedbackAllowance(null, 0)).toBeNull()
        expect(resolveAiFeedbackAllowance(undefined, undefined)).toBeNull()
        expect(resolveAiFeedbackAllowance(0, 0)).toBeNull()
        expect(resolveAiFeedbackAllowance(Number.NaN, 1)).toBeNull()
    })
})
