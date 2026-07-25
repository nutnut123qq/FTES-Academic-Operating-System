import { describe, expect, it } from "vitest"
import { RestError } from "@/modules/api/rest/client"
import {
    normalizeExecution,
    normalizeGrade,
    resolveCodingErrorKey,
    toApiTestCases,
} from "./codingExecution"

/**
 * Unit — the Run/Submit response mapping of the coding practice panel.
 *
 * `POST /ai/coding/execute-code` returns the ftes-ai-service block FLAT
 * (`{supported, results, passed, total}`) while `grade-code` nests it under
 * `execution`; the panel must read both without inventing a verdict.
 */
describe("normalizeExecution", () => {
    it("maps the flat execute-code payload into rows + counters", () => {
        const outcome = normalizeExecution({
            supported: true,
            passed: 1,
            total: 2,
            results: [
                { input: "1 2", expected: "3", actual: "3", passed: true, status: "Accepted", time: 0.02 },
                {
                    input: "2 2",
                    expected: "4",
                    actual: "5",
                    passed: false,
                    status: "Wrong Answer",
                    stderr: "",
                },
            ],
        })

        expect(outcome.rows).toHaveLength(2)
        expect(outcome.rows[0]).toMatchObject({
            id: "case-0",
            input: "1 2",
            expected: "3",
            actual: "3",
            passed: true,
            status: "Accepted",
            time: 0.02,
        })
        expect(outcome.rows[1].passed).toBe(false)
        expect(outcome.rows[1].stderr).toBeUndefined()
        expect(outcome.passedCount).toBe(1)
        expect(outcome.total).toBe(2)
        expect(outcome.supported).toBe(true)
    })

    it("reads the wrapped `{execution}` shape too", () => {
        const outcome = normalizeExecution({
            execution: { results: [{ passed: true, actual: "ok" }], passed: 1, total: 1 },
        })

        expect(outcome.total).toBe(1)
        expect(outcome.rows[0].actual).toBe("ok")
    })

    it("recomputes the counters when the backend omits them", () => {
        const outcome = normalizeExecution({
            results: [{ passed: true }, { passed: false }, { passed: true }],
        })

        expect(outcome.passedCount).toBe(2)
        expect(outcome.total).toBe(3)
    })

    it("treats a missing/garbage payload as nothing executed", () => {
        expect(normalizeExecution(null)).toEqual({
            rows: [],
            passedCount: 0,
            total: 0,
            supported: true,
        })
        expect(normalizeExecution("boom").rows).toEqual([])
    })

    it("keeps `supported: false` so the UI says not-executed instead of failed", () => {
        expect(normalizeExecution({ supported: false, results: [], passed: 0, total: 0 }).supported)
            .toBe(false)
    })

    it("never marks a row passed unless the backend said so", () => {
        const outcome = normalizeExecution({ results: [{ passed: "true" }, {}] })
        expect(outcome.rows.map((row) => row.passed)).toEqual([false, false])
        expect(outcome.passedCount).toBe(0)
    })
})

describe("normalizeGrade", () => {
    it("maps score/verdict/criteria/model and the nested execution block", () => {
        const grade = normalizeGrade({
            score: 7.5,
            max: 10,
            verdict: "PARTIAL",
            criteria: [{ name: "Đúng đắn", score: 3, max: 5, comment: "thiếu case rỗng" }],
            feedback: "Tốt nhưng thiếu biên",
            improvements: ["Xử lý mảng rỗng", ""],
            model: "openai/gpt-4o-mini",
            model_note: "Chấm bởi gpt-4o-mini",
            execution: { results: [{ passed: true }], passed: 1, total: 1 },
        })

        expect(grade.score).toBe(7.5)
        expect(grade.verdict).toBe("PARTIAL")
        expect(grade.criteria).toEqual([
            { name: "Đúng đắn", score: 3, max: 5, comment: "thiếu case rỗng" },
        ])
        expect(grade.improvements).toEqual(["Xử lý mảng rỗng"])
        expect(grade.model).toBe("openai/gpt-4o-mini")
        expect(grade.modelNote).toBe("Chấm bởi gpt-4o-mini")
        expect(grade.execution.total).toBe(1)
    })

    it("falls back to a 0/10 empty grade for an unreadable payload", () => {
        const grade = normalizeGrade(undefined)
        expect(grade).toMatchObject({ score: 0, max: 10, criteria: [], improvements: [] })
        expect(grade.execution.rows).toEqual([])
    })
})

describe("toApiTestCases", () => {
    it("renames expected → output and drops fully blank rows", () => {
        expect(
            toApiTestCases([
                { id: "a", input: "1", expected: "2" },
                { id: "b", input: "  ", expected: "" },
                { id: "c", input: "", expected: "3" },
            ]),
        ).toEqual([
            { input: "1", output: "2" },
            { input: "", output: "3" },
        ])
    })
})

describe("resolveCodingErrorKey", () => {
    it("maps challenge domain codes", () => {
        expect(
            resolveCodingErrorKey(
                new RestError("nope", 400, "CHALLENGE_MAX_SUBMISSIONS"),
            ),
        ).toBe("maxSubmissions")
        expect(resolveCodingErrorKey(new RestError("nope", 400, "CHALLENGE_NOT_OPEN"))).toBe(
            "notOpen",
        )
        expect(
            resolveCodingErrorKey(new RestError("nope", 403, "CHALLENGE_COURSE_ACCESS_DENIED")),
        ).toBe("courseLocked")
    })

    it("maps HTTP statuses", () => {
        expect(resolveCodingErrorKey(new RestError("x", 401))).toBe("unauthorized")
        expect(resolveCodingErrorKey(new RestError("x", 403))).toBe("forbidden")
        expect(resolveCodingErrorKey(new RestError("x", 404))).toBe("notFound")
        expect(resolveCodingErrorKey(new RestError("x", 429))).toBe("rateLimited")
        expect(resolveCodingErrorKey(new RestError("x", 503, "AI_CODE_DOWN"))).toBe("unavailable")
        expect(resolveCodingErrorKey(new RestError("x", 502))).toBe("executionFailed")
    })

    it("maps an aborted (timed-out) request", () => {
        const timeout = Object.assign(new Error("timeout of 180000ms exceeded"), {
            code: "ECONNABORTED",
        })
        expect(resolveCodingErrorKey(timeout)).toBe("timeout")
        expect(resolveCodingErrorKey(new Error("Network Error"))).toBe("generic")
    })
})
