import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Routes — the three legacy course surfaces removed by learn-exercises-wire task 5
 * (`/lessons/[lessonId]`, `/quiz`, `/assignments`) must server-redirect old deep-links
 * into the learn shell's content dashboard instead of 404-ing. Each page is an async
 * server component that awaits its params (Next 16) and calls `redirect`.
 */

const redirectMock = vi.fn()

vi.mock("next/navigation", () => ({
    redirect: (target: string) => redirectMock(target),
}))

import LegacyLessonPage from "./lessons/[lessonId]/page"
import LegacyQuizPage from "./quiz/page"
import LegacyAssignmentsPage from "./assignments/page"

beforeEach(() => {
    redirectMock.mockReset()
})

describe("legacy course routes → /learn/content", () => {
    it("redirects the legacy lesson deep-link", async () => {
        await LegacyLessonPage({
            params: Promise.resolve({ locale: "vi", courseId: "khoa-1", lessonId: "l9" }),
        })
        expect(redirectMock).toHaveBeenCalledWith("/vi/courses/khoa-1/learn/content")
    })

    it("redirects the legacy quiz surface", async () => {
        await LegacyQuizPage({
            params: Promise.resolve({ locale: "en", courseId: "khoa-2" }),
        })
        expect(redirectMock).toHaveBeenCalledWith("/en/courses/khoa-2/learn/content")
    })

    it("redirects the legacy assignments surface", async () => {
        await LegacyAssignmentsPage({
            params: Promise.resolve({ locale: "vi", courseId: "khoa-3" }),
        })
        expect(redirectMock).toHaveBeenCalledWith("/vi/courses/khoa-3/learn/content")
    })
})
