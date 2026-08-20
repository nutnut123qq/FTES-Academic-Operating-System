/**
 * Regression — the term facet on `/courses` filters SERVER-side, and `termId` is part
 * of the SWR key.
 *
 * The BE caches `GET /courses` under a hash of its filters for 60s with no active
 * evict. If `termId` were missing from the FE cache key, picking term B would read the
 * settled entry SWR still holds for term A and paint the wrong courses — and nothing
 * on the page could force it to refresh. So this pins both halves: the id reaches the
 * fetcher, and two different ids never share one cache entry.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import type { CourseListParams } from "@/modules/api/rest/course"

const getCoursesMock = vi.fn()

vi.mock("@/modules/api/rest/course", () => ({
    getCourses: (params?: CourseListParams) => getCoursesMock(params),
}))

import { useQueryCoursesSwr } from "./useQueryCoursesSwr"

/** One BE summary row, enough for `toCourse` to map it. */
const summary = (slug: string) => ({
    slugName: slug,
    courseCode: slug.toUpperCase(),
    title: slug,
    level: "BASIC",
    categoryId: "cat-1",
    totalLessons: 3,
})

/** An SWR cache private to each render, so cases can't leak into one another. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{
        provider: () => new Map(),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    }}>
        {children}
    </SWRConfig>
)

describe("useQueryCoursesSwr — term facet", () => {
    beforeEach(() => {
        getCoursesMock.mockReset()
        getCoursesMock.mockResolvedValue([summary("a")])
    })

    it("passes termId through to GET /courses", async () => {
        const { result } = renderHook(
            () => useQueryCoursesSwr({ categoryId: "cat-1", termId: "t-fall" }),
            { wrapper },
        )
        await waitFor(() => expect(result.current.courses).toHaveLength(1))
        expect(getCoursesMock).toHaveBeenCalledWith(
            expect.objectContaining({ categoryId: "cat-1", termId: "t-fall" }),
        )
    })

    it("omits termId (never an empty string) when no term is selected", async () => {
        const { result } = renderHook(() => useQueryCoursesSwr(), { wrapper })
        await waitFor(() => expect(result.current.courses).toHaveLength(1))
        expect(getCoursesMock).toHaveBeenCalledWith(
            expect.objectContaining({ termId: undefined }),
        )
    })

    it("caches each term separately — term B never reads term A's entry", async () => {
        getCoursesMock.mockImplementation((params?: CourseListParams) =>
            Promise.resolve([summary(params?.termId === "t-b" ? "from-b" : "from-a")]))

        // one shared cache across both hooks — exactly the leak this guards against
        const cache = new Map()
        const sharedWrapper = ({ children }: { children: React.ReactNode }) => (
            <SWRConfig value={{
                provider: () => cache,
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
            }}>
                {children}
            </SWRConfig>
        )

        const a = renderHook(() => useQueryCoursesSwr({ termId: "t-a" }), { wrapper: sharedWrapper })
        await waitFor(() => expect(a.result.current.courses[0]?.id).toBe("from-a"))

        const b = renderHook(() => useQueryCoursesSwr({ termId: "t-b" }), { wrapper: sharedWrapper })
        await waitFor(() => expect(b.result.current.courses[0]?.id).toBe("from-b"))
    })
})
