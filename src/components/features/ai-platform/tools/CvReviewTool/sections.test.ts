import { describe, expect, it } from "vitest"
import {
    cvHeaderErrors,
    emptyCvSections,
    isCvHeaderValid,
    isEmailLike,
    linesToList,
    listToLines,
} from "./sections"

/**
 * Unit — the pure CV builder helpers (`ai-hub-live-tools` task 4.5): the empty
 * CV shape the form hydrates from, the multiline ⇆ list conversion the bullet
 * fields round-trip through, and the header validation that gates save / review
 * / PDF export (spec: `header.fullName` + email-shaped `header.email` required).
 */

describe("emptyCvSections", () => {
    it("matches the BE jsonb section shape (header obj + empty repeaters)", () => {
        const cv = emptyCvSections()
        expect(cv.header).toEqual({
            fullName: "",
            email: "",
            phone: "",
            location: "",
            links: [],
        })
        expect(cv.summary).toBe("")
        expect(cv.education).toEqual([])
        expect(cv.experience).toEqual([])
        expect(cv.projects).toEqual([])
        expect(cv.skills).toEqual([])
        expect(cv.awards).toEqual([])
    })
})

describe("linesToList / listToLines", () => {
    it("splits multiline text into trimmed non-blank items", () => {
        expect(linesToList("  one \n\n two\n   \nthree")).toEqual([
            "one",
            "two",
            "three",
        ])
    })

    it("returns [] for blank text and joins back with newlines", () => {
        expect(linesToList("  \n \n")).toEqual([])
        expect(listToLines(["a", "b"])).toBe("a\nb")
        expect(listToLines(undefined)).toBe("")
    })

    it("round-trips a clean list unchanged", () => {
        const list = ["Xây REST API", "Tối ưu SQL"]
        expect(linesToList(listToLines(list))).toEqual(list)
    })
})

describe("isEmailLike", () => {
    it("accepts a plain user@host.tld shape (with surrounding spaces)", () => {
        expect(isEmailLike("khoa@ftes.vn")).toBe(true)
        expect(isEmailLike("  khoa@ftes.vn  ")).toBe(true)
    })

    it("rejects missing @, missing TLD, spaces, and empties", () => {
        expect(isEmailLike("khoa.ftes.vn")).toBe(false)
        expect(isEmailLike("khoa@ftes")).toBe(false)
        expect(isEmailLike("kh oa@ftes.vn")).toBe(false)
        expect(isEmailLike("")).toBe(false)
        expect(isEmailLike(undefined)).toBe(false)
    })
})

describe("cvHeaderErrors", () => {
    const withHeader = (fullName: string, email: string) => {
        const cv = emptyCvSections()
        cv.header = { ...cv.header, fullName, email }
        return cv
    }

    it("flags both required fields on an empty CV", () => {
        expect(cvHeaderErrors(emptyCvSections())).toEqual(["fullName", "email"])
        expect(isCvHeaderValid(emptyCvSections())).toBe(false)
    })

    it("flags a blank-only fullName and a malformed email individually", () => {
        expect(cvHeaderErrors(withHeader("   ", "khoa@ftes.vn"))).toEqual([
            "fullName",
        ])
        expect(cvHeaderErrors(withHeader("Nguyễn Anh Khoa", "not-an-email"))).toEqual([
            "email",
        ])
    })

    it("passes a filled name + email-shaped email", () => {
        const cv = withHeader("Nguyễn Anh Khoa", "khoa@ftes.vn")
        expect(cvHeaderErrors(cv)).toEqual([])
        expect(isCvHeaderValid(cv)).toBe(true)
    })
})
