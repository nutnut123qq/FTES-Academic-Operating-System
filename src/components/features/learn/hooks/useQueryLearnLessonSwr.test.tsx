import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Hook — the lesson reader query (change `learn-gate-uses-real-signals`).
 *
 * Regression: `hasVideo` gated the whole video block on `accessLevel === "PREVIEW"`, a
 * USER-SCOPED field that is null for a signed-out visitor. Those visitors got no player
 * AND no buy CTA — the free-preview entry vanished for exactly the audience it exists to
 * court. The content-scoped `previewSeconds` must open the same branch.
 */

const detailMock = vi.fn()

vi.mock("@/modules/api/rest/course", () => ({
    getCourseDetail: () => detailMock(),
    getCourseProgress: () => Promise.resolve({ lessons: [] }),
    readLessonContent: () =>
        Promise.resolve({ lessonId: "l1", bodyMd: "", readingMinutes: null, locked: true, teaser: null }),
}))

import { useQueryLearnLessonSwr } from "./useQueryLearnLessonSwr"

/** Curriculum with ONE video lesson; `accessLevel` null = signed-out visitor. */
const detail = (previewSeconds: number) => ({
    course: { id: "uuid-a", title: "Khóa A" },
    description: "",
    sections: [
        {
            id: "m1",
            name: "Học phần 1",
            description: "",
            sortOrder: 1,
            lessons: [
                {
                    id: "l1",
                    name: "Bài 1",
                    description: "",
                    sortOrder: 1,
                    type: "VIDEO",
                    videoStatus: "READY",
                    // ref hidden by the catalog for a locked viewer (the stream supplies it)
                    videoRef: null,
                    locked: true,
                    accessLevel: null,
                    previewSeconds,
                    packageSlugs: [],
                },
            ],
        },
    ],
})

describe("useQueryLearnLessonSwr — the section's real title reaches the reader", () => {
    it("maps the section name to the ordinal and its description to the title", async () => {
        const titled = detail(0)
        titled.sections[0].description = "Làm quen với ngôn ngữ C/C++"
        detailMock.mockResolvedValue(titled)
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-section-title", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        // `name` is only the ordinal ("Học phần 1"); the breadcrumb shows `moduleDescription`
        expect(result.current.lesson?.moduleTitle).toBe("Học phần 1")
        expect(result.current.lesson?.moduleDescription).toBe("Làm quen với ngôn ngữ C/C++")
    })

    it("leaves the title empty when the section carries none (reader falls back to the ordinal)", async () => {
        detailMock.mockResolvedValue(detail(0))
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-section-untitled", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.moduleDescription).toBe("")
        expect(result.current.lesson?.moduleTitle).toBe("Học phần 1")
    })
})

describe("useQueryLearnLessonSwr — previewSeconds keeps the preview reachable", () => {
    it("mounts the video block for a viewer with no accessLevel when a preview window exists", async () => {
        detailMock.mockResolvedValue(detail(900))
        // distinct course key per test: SWR's cache is module-global across cases
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-preview", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.hasVideo).toBe(true)
    })

    it("does not mount the video block when there is no preview window and no ref", async () => {
        detailMock.mockResolvedValue(detail(0))
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-no-preview", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.hasVideo).toBe(false)
    })
})
