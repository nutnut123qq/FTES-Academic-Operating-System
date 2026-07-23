import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { LessonContentView } from "@/modules/api/rest/course"

/**
 * Hook — `hasChallenge` / `challengeId` are sourced from the CURRICULUM tree
 * (`CourseReadApi` → `LessonView`), NOT the `GET /lessons/{id}/content` endpoint.
 *
 * Regression: a VIDEO lesson has no `/content` markdown row, so that endpoint 404s;
 * the hook catches the 404 into an EMPTY body. When `hasChallenge` was read off that
 * empty content response it collapsed to `false` on every video lesson, hiding the
 * challenge tab/rail even though the lesson really does have a linked challenge. The
 * flag must come from the curriculum, which is served for every lesson regardless of
 * the content 404 — so `readLessonContent` REJECTS in these cases (exactly the 404).
 */

const detailMock = vi.fn()
// Default: the 404 a VIDEO lesson (no content row) hits — the hook must survive it.
// Individual tests override this to exercise the legacy content-endpoint fallback.
const contentMock = vi.fn<() => Promise<LessonContentView>>(() =>
    Promise.reject(new Error("Lesson has no content")),
)

vi.mock("@/modules/api/rest/course", () => ({
    getCourseDetail: () => detailMock(),
    getCourseProgress: () => Promise.resolve({ lessons: [] }),
    readLessonContent: () => contentMock(),
}))

import { useQueryLearnLessonSwr } from "./useQueryLearnLessonSwr"

/** A VIDEO lesson whose challenge signal lives ONLY on the curriculum tree. */
const detail = (over: { hasChallenge?: boolean; challengeId?: string | null }) => ({
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
                    name: "Bài video",
                    description: "",
                    sortOrder: 1,
                    type: "VIDEO",
                    videoStatus: "READY",
                    videoRef: "video_abc",
                    locked: false,
                    accessLevel: "FULL",
                    previewSeconds: 0,
                    packageSlugs: [],
                    hasChallenge: over.hasChallenge ?? false,
                    challengeId: over.challengeId ?? null,
                },
            ],
        },
    ],
})

/**
 * A legacy-BE curriculum: the additive `hasChallenge` / `challengeId` flags are ABSENT
 * from the tree (older deployment). It is a DOCUMENT lesson, so `/content` resolves and
 * carries the challenge signal — the path the tree-first read must degrade to.
 */
const legacyDetail = () => ({
    course: { id: "uuid-legacy", title: "Khóa legacy" },
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
                    name: "Bài tài liệu",
                    description: "",
                    sortOrder: 1,
                    type: "DOCUMENT",
                    videoStatus: "",
                    videoRef: null,
                    locked: false,
                    accessLevel: "FULL",
                    previewSeconds: 0,
                    packageSlugs: [],
                    // hasChallenge / challengeId intentionally OMITTED (undefined).
                },
            ],
        },
    ],
})

describe("useQueryLearnLessonSwr — challenge signal from the curriculum tree", () => {
    beforeEach(() => {
        // Reset to the default 404 so an override in one test never leaks into the next.
        contentMock.mockImplementation(() =>
            Promise.reject(new Error("Lesson has no content")),
        )
    })

    it("keeps hasChallenge + challengeId from the tree even when the content endpoint 404s", async () => {
        detailMock.mockResolvedValue(detail({ hasChallenge: true, challengeId: "ch-1" }))
        // distinct course key per test: SWR's cache is module-global across cases.
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-has-challenge", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.hasChallenge).toBe(true)
        expect(result.current.lesson?.challengeId).toBe("ch-1")
    })

    it("reports no challenge when the tree flag is false (content still 404s)", async () => {
        detailMock.mockResolvedValue(detail({ hasChallenge: false }))
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-no-challenge", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.hasChallenge).toBe(false)
        expect(result.current.lesson?.challengeId).toBeNull()
    })

    it("degrades to the content endpoint when the curriculum omits the flag (legacy BE)", async () => {
        // Tree carries NO hasChallenge (undefined, not false) — the fallback must reach
        // `content.hasChallenge`. A `?? false` coercion in flattenCurriculum would break this.
        detailMock.mockResolvedValue(legacyDetail())
        contentMock.mockResolvedValue({
            lessonId: "l1",
            bodyMd: "body",
            readingMinutes: 3,
            locked: false,
            teaser: null,
            hasChallenge: true,
            challengeId: "ch-legacy",
        })
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-legacy", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.hasChallenge).toBe(true)
        expect(result.current.lesson?.challengeId).toBe("ch-legacy")
    })
})
