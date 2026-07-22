import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the AI REST client fns the `ai-hub-live-tools` pages sit on (tasks
 * 3.5/4.5/5.4): the job submits, the shared job poll read, the quota map, and
 * the study-plan CRUD. `restRequest` is mocked so each test pins the HTTP
 * contract (method / url / body / params / timeout) and that the unwrapped
 * envelope `data` comes back verbatim — the `code:1002` Accepted unwrap itself
 * is covered in `client/client.test.ts`.
 */

const restRequest = vi.fn()

vi.mock("@/modules/api/rest/client", () => ({
    restRequest: (...args: Array<unknown>) => restRequest(...args),
}))

import {
    archiveStudyPlan,
    createStudyPlan,
    getJob,
    getMyAiQuota,
    getStudyPlans,
    patchStudyPlanProgress,
    submitCodeReviewJob,
    submitCvReviewJob,
    submitFlashcardsJob,
    submitQuizJob,
    submitSummaryJob,
} from "./ai"

const JOB_REF = { jobId: "job-1", status: "PENDING" }

beforeEach(() => {
    restRequest.mockReset()
    restRequest.mockResolvedValue(JOB_REF)
})

describe("job submits", () => {
    it("POSTs a summary job body to /ai/learning/summary and returns the JobRef", async () => {
        const body = { text: "Nội dung", language: "vi" }
        const result = await submitSummaryJob(body)
        expect(restRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/ai/learning/summary",
            data: body,
        })
        expect(result).toBe(JOB_REF)
    })

    it("POSTs flashcards / quiz / code-review / cv-review to their endpoints", async () => {
        await submitFlashcardsJob({ lessonId: "l1", cardCount: 10, language: "vi" })
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "POST",
            url: "/ai/learning/flashcards",
            data: { lessonId: "l1", cardCount: 10, language: "vi" },
        })

        await submitQuizJob({ text: "x", questionCount: 5, difficulty: "medium", language: "vi" })
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "POST",
            url: "/ai/learning/quiz",
            data: { text: "x", questionCount: 5, difficulty: "medium", language: "vi" },
        })

        await submitCodeReviewJob({ code: "x", language: "python", question: "" })
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "POST",
            url: "/ai/coding/review",
            data: { code: "x", language: "python", question: "" },
        })

        // Builder path submits {cvProfileId}; upload path submits {storageKey}.
        await submitCvReviewJob({ cvProfileId: "cv-1" })
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "POST",
            url: "/ai/career/cv-review",
            data: { cvProfileId: "cv-1" },
        })
        await submitCvReviewJob({ storageKey: "users/u1/cv.pdf" })
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "POST",
            url: "/ai/career/cv-review",
            data: { storageKey: "users/u1/cv.pdf" },
        })
    })
})

describe("job poll + quota", () => {
    it("GETs /ai/jobs/{id} authenticated", async () => {
        const job = { id: "job-1", feature: "SUMMARY", status: "RUNNING" }
        restRequest.mockResolvedValue(job)
        const result = await getJob("job-1")
        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/ai/jobs/job-1",
            authenticated: true,
        })
        expect(result).toBe(job)
    })

    it("GETs the /ai/quotas/me map authenticated", async () => {
        restRequest.mockResolvedValue({ SUMMARY: 10 })
        const result = await getMyAiQuota()
        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/ai/quotas/me",
            authenticated: true,
        })
        expect(result).toEqual({ SUMMARY: 10 })
    })
})

describe("study plans", () => {
    it("POSTs the create body with the long 120s timeout (sync generation)", async () => {
        const body = {
            goal: "Học Java",
            deadlineDays: 30,
            hoursPerWeek: 8,
            language: "vi",
        }
        restRequest.mockResolvedValue({ id: "plan-1" })
        await createStudyPlan(body)
        expect(restRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/ai/learning/study-plan",
            data: body,
            authenticated: true,
            timeout: 120_000,
        })
    })

    it("GETs the plan list, PATCHes progress with the task key, DELETEs to archive", async () => {
        restRequest.mockResolvedValue([])
        await getStudyPlans({ page: 0, size: 10 })
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "GET",
            url: "/ai/learning/study-plans",
            params: { page: 0, size: 10 },
            authenticated: true,
        })

        restRequest.mockResolvedValue({ id: "plan-1", percentDone: 33 })
        await patchStudyPlanProgress("plan-1", { taskKey: "w2:0", done: true })
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "PATCH",
            url: "/ai/learning/study-plans/plan-1/progress",
            data: { taskKey: "w2:0", done: true },
            authenticated: true,
        })

        await archiveStudyPlan("plan-1")
        expect(restRequest).toHaveBeenLastCalledWith({
            method: "DELETE",
            url: "/ai/learning/study-plans/plan-1",
            authenticated: true,
        })
    })
})
