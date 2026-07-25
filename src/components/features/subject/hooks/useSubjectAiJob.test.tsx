import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RestError } from "@/modules/api/rest/client"
import type { JobView } from "@/modules/api/rest/ai/types"
import { AI_JOB_POLL_INTERVAL_MS } from "@/components/features/ai-platform/hooks/useAiJobPolling"

/**
 * Unit — the subject AI tools' job layer.
 *
 * Pins the two things a wrong wiring breaks silently:
 *  - the POLL STOPS on a terminal job status (COMPLETED / FAILED / CANCELLED) and
 *    keeps its 2.5s cadence while PENDING/RUNNING — a poll that never stops burns
 *    the API forever behind a finished tool;
 *  - the worker payloads map onto what the surfaces render (summary key points +
 *    abstract, quiz `correct` → a gradable `answerIndex`).
 *
 * `swr` is mocked to capture the `(key, fetcher, config)` triple and serve a
 * controllable `data`, and the REST client is mocked so no request is attempted.
 */

type SwrCall = {
    key: unknown
    fetcher: (() => unknown) | undefined
    config: Record<string, unknown> | undefined
}

const swrCalls: Array<SwrCall> = []
let swrData: JobView | undefined
const swrMutate = vi.fn()

vi.mock("swr", () => ({
    default: (
        key: unknown,
        fetcher: (() => unknown) | undefined,
        config: Record<string, unknown> | undefined,
    ) => {
        swrCalls.push({ key, fetcher, config })
        return { data: swrData, error: undefined, isLoading: false, mutate: swrMutate }
    },
}))

vi.mock("@/modules/api/rest/ai", () => ({
    getJob: vi.fn(),
    submitSummaryJob: vi.fn(),
    submitQuizJob: vi.fn(),
    submitFlashcardsJob: vi.fn(),
    submitOcrJob: vi.fn(),
}))

import { classifySubjectAiJobError, useSubjectAiJob } from "./useSubjectAiJob"
import { mapSummaryJobResult } from "./useMutateSubjectAiSummarySwr"
import { mapQuizJobResult } from "./useMutateSubjectAiQuizSwr"
import { mapFlashcardsJobResult } from "./useMutateSubjectAiFlashcardsSwr"

const jobView = (over: Partial<JobView>): JobView => ({
    id: "job-1",
    feature: "SUMMARY",
    status: "RUNNING",
    ...over,
})

const lastCall = () => swrCalls[swrCalls.length - 1]

/** The refreshInterval fn handed to SWR, applied to a given latest JobView. */
const intervalFor = (latest: JobView | undefined): number => {
    const refreshInterval = lastCall().config?.refreshInterval as (
        latest: JobView | undefined,
    ) => number
    return refreshInterval(latest)
}

beforeEach(() => {
    swrCalls.length = 0
    swrData = undefined
    swrMutate.mockReset()
})

describe("useSubjectAiJob — polling lifecycle", () => {
    it("fires no request before a job is submitted", () => {
        renderHook(() => useSubjectAiJob())
        expect(lastCall().key).toBeNull()
    })

    it("polls the accepted job and STOPS on every terminal status", async () => {
        const { result } = renderHook(() => useSubjectAiJob())

        await act(async () => {
            await result.current.run(async () => ({ jobId: "job-9", status: "PENDING" }))
        })

        expect(lastCall().key).toEqual(["GET_AI_JOB", "job-9"])
        // still working → keep polling
        expect(intervalFor(jobView({ status: "PENDING" }))).toBe(AI_JOB_POLL_INTERVAL_MS)
        expect(intervalFor(jobView({ status: "RUNNING" }))).toBe(AI_JOB_POLL_INTERVAL_MS)
        // terminal → stop (0)
        expect(intervalFor(jobView({ status: "COMPLETED" }))).toBe(0)
        expect(intervalFor(jobView({ status: "FAILED" }))).toBe(0)
        expect(intervalFor(jobView({ status: "CANCELLED" }))).toBe(0)
    })

    it("exposes the parsed result once COMPLETED and flags a FAILED job", async () => {
        swrData = jobView({ status: "COMPLETED", result: "{\"tldr\":\"ngắn gọn\"}" })
        const completed = renderHook(() => useSubjectAiJob<{ tldr: string }>())
        await act(async () => {
            await completed.result.current.run(async () => ({
                jobId: "job-9",
                status: "PENDING",
            }))
        })
        expect(completed.result.current.result).toEqual({ tldr: "ngắn gọn" })
        expect(completed.result.current.isBusy).toBe(false)
        expect(completed.result.current.errorKey).toBeNull()

        swrData = jobView({ status: "FAILED", errorMessage: "OCR không trích được text" })
        const failed = renderHook(() => useSubjectAiJob())
        await act(async () => {
            await failed.result.current.run(async () => ({
                jobId: "job-9",
                status: "PENDING",
            }))
        })
        expect(failed.result.current.errorKey).toBe("failed")
        expect(failed.result.current.failureMessage).toBe("OCR không trích được text")
        expect(failed.result.current.isBusy).toBe(false)
    })

    it("surfaces a rejected submit as its own message key", async () => {
        const { result } = renderHook(() => useSubjectAiJob())
        await act(async () => {
            await result.current.run(async () => {
                throw new RestError("over quota", 429, "AI_QUOTA_EXCEEDED")
            })
        })
        expect(result.current.errorKey).toBe("quota")
        // no job id was accepted → nothing is polled
        expect(lastCall().key).toBeNull()
    })
})

describe("classifySubjectAiJobError", () => {
    it("maps each rejection to its own message key", () => {
        expect(classifySubjectAiJobError(new RestError("x", 429))).toBe("quota")
        expect(classifySubjectAiJobError(new RestError("x", 400, "AI_QUOTA_EXCEEDED"))).toBe(
            "quota",
        )
        expect(classifySubjectAiJobError(new RestError("x", 401))).toBe("auth")
        expect(classifySubjectAiJobError(new RestError("x", 403))).toBe("forbidden")
        expect(classifySubjectAiJobError(new RestError("x", 404))).toBe("notFound")
        expect(classifySubjectAiJobError(new RestError("x", 400, "AI_INPUT_INVALID"))).toBe(
            "invalid",
        )
        expect(classifySubjectAiJobError(new RestError("x", 500))).toBe("failed")
        expect(classifySubjectAiJobError(new Error("network"))).toBe("failed")
    })
})

describe("mapSummaryJobResult", () => {
    it("flattens the worker payload into key points + abstract", () => {
        expect(
            mapSummaryJobResult({
                tldr: "  Bản tóm tắt  ",
                key_points: ["Ý 1", "", "Ý 2"],
                glossary: [{ term: "REST", definition: "kiểu kiến trúc" }],
                estimated_read_min: 4,
                model: "gemini",
            }),
        ).toEqual({
            keyPoints: ["Ý 1", "Ý 2"],
            abstract: "Bản tóm tắt",
            glossary: [{ term: "REST", definition: "kiểu kiến trúc" }],
            readMinutes: 4,
            model: "gemini",
        })
    })

    it("keeps a bare-markdown result as the abstract and drops an empty one", () => {
        expect(mapSummaryJobResult("## Tóm tắt")?.abstract).toBe("## Tóm tắt")
        expect(mapSummaryJobResult(undefined)).toBeUndefined()
        expect(mapSummaryJobResult({ key_points: [], tldr: "" })).toBeUndefined()
    })
})

describe("mapQuizJobResult", () => {
    it("resolves index / letter / text answers into a gradable answerIndex", () => {
        const quiz = mapQuizJobResult({
            questions: [
                { question: "A?", options: ["a", "b", "c"], correct: 2 },
                { question: "B?", options: ["a", "b"], correct: "B" },
                {
                    question: "C?",
                    options: ["đúng", "sai"],
                    correct: "sai",
                    explanation: " vì thế ",
                },
            ],
            model: "gemini",
        })
        expect(quiz.questions.map((question) => question.answerIndex)).toEqual([2, 1, 1])
        expect(quiz.questions.map((question) => question.id)).toEqual(["q1", "q2", "q3"])
        expect(quiz.questions[2].explanation).toBe("vì thế")
        expect(quiz.model).toBe("gemini")
    })

    it("marks an unmatched answer as -1 and drops option-less questions", () => {
        const quiz = mapQuizJobResult({
            questions: [
                { question: "A?", options: ["a", "b"], correct: "zzz" },
                { question: "no options", options: [], correct: 0 },
            ],
        })
        expect(quiz.questions).toHaveLength(1)
        expect(quiz.questions[0].answerIndex).toBe(-1)
    })

    it("returns an empty quiz before the job completes", () => {
        expect(mapQuizJobResult(undefined).questions).toEqual([])
    })
})

describe("mapFlashcardsJobResult", () => {
    it("builds a titled deck and drops half-empty cards", () => {
        const deck = mapFlashcardsJobResult(
            {
                cards: [
                    { front: "REST", back: "kiểu kiến trúc", hint: "HTTP" },
                    { front: "  ", back: "trống" },
                ],
                model: "gemini",
            },
            "Bài 1",
        )
        expect(deck?.title).toBe("Bài 1")
        expect(deck?.cards).toHaveLength(1)
        expect(deck?.cards[0]).toMatchObject({ id: "f1", term: "REST", hint: "HTTP" })
    })

    it("returns undefined when nothing usable was generated", () => {
        expect(mapFlashcardsJobResult({ cards: [] }, "Bài 1")).toBeUndefined()
        expect(mapFlashcardsJobResult(undefined, "Bài 1")).toBeUndefined()
    })
})
