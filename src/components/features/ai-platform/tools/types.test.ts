import { describe, expect, it } from "vitest"
import { isCorrectQuizOption } from "./types"

/**
 * Unit — {@link isCorrectQuizOption}, the quiz grading normalizer
 * (`ai-hub-live-tools` task 3.5). The worker's `correct` field arrives in three
 * shapes (0-based index, letter, exact option text) and this pins each mapping —
 * plus the numeric-string variant and the case/space-insensitive text match —
 * so client-side grading agrees with the worker no matter which shape ships.
 */
describe("isCorrectQuizOption", () => {
    it("matches a 0-based numeric index", () => {
        expect(isCorrectQuizOption(1, 1, "B option")).toBe(true)
        expect(isCorrectQuizOption(1, 0, "A option")).toBe(false)
        expect(isCorrectQuizOption(0, 0, "A option")).toBe(true)
    })

    it("matches a numeric string index", () => {
        expect(isCorrectQuizOption("2", 2, "C option")).toBe(true)
        expect(isCorrectQuizOption("2", 1, "B option")).toBe(false)
    })

    it("matches a letter (either case) by alphabet position", () => {
        expect(isCorrectQuizOption("B", 1, "whatever")).toBe(true)
        expect(isCorrectQuizOption("b", 1, "whatever")).toBe(true)
        expect(isCorrectQuizOption("A", 1, "whatever")).toBe(false)
        expect(isCorrectQuizOption(" C ", 2, "whatever")).toBe(true)
    })

    it("matches the exact option text case/space-insensitively", () => {
        expect(isCorrectQuizOption("Hà Nội", 3, "  hà nội ")).toBe(true)
        expect(isCorrectQuizOption("Hà Nội", 3, "Đà Nẵng")).toBe(false)
    })

    it("returns false for a missing correct field", () => {
        expect(isCorrectQuizOption(undefined, 0, "A option")).toBe(false)
    })
})
