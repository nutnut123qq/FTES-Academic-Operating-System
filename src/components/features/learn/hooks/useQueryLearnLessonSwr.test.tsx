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

/**
 * Regression 2026-08-21: bài quay bằng đường upload MỚI mang ref `aosvideo:<uuid>`.
 * `isVideoRef` chỉ nhận YouTube và `video_*` nên mọi bài như vậy rơi xuống nhánh thân bài,
 * và bài video không có body ⇒ học viên thấy đúng một dòng "This lesson has no content yet."
 * (đo thật trên SWR302: BE trả provider=HLS + manifest ký, video nằm nguyên trên R2).
 */
describe("useQueryLearnLessonSwr — ref của đường upload mới vẫn là video", () => {
    /** Curriculum với MỘT bài video đã mở khoá, ref theo shape người gọi truyền vào. */
    const withRef = (videoRef: string | null) => ({
        course: { id: "uuid-b", title: "Khóa B" },
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
                        videoRef,
                        locked: false,
                        accessLevel: "FULL",
                        previewSeconds: 0,
                        packageSlugs: [],
                    },
                ],
            },
        ],
    })

    it("mount player cho ref aosvideo:<uuid> (FULL, không có cửa sổ preview)", async () => {
        detailMock.mockResolvedValue(withRef("aosvideo:65d72559-c777-425f-b279-270ef1699b2c"))
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-aosvideo", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.hasVideo).toBe(true)
        // KHÔNG được coi là thân bài HTML — nếu rơi vào documentHtml thì player biến mất
        expect(result.current.lesson?.documentHtml).toBeNull()
    })

    it("giữ nguyên hành vi cũ: token video_* và link YouTube vẫn là video", async () => {
        detailMock.mockResolvedValue(withRef("video_3eabdf6b-n75"))
        const legacy = renderHook(() => useQueryLearnLessonSwr("khoa-legacy-token", "l1"))
        await waitFor(() => expect(legacy.result.current.lesson).toBeTruthy())
        expect(legacy.result.current.lesson?.hasVideo).toBe(true)

        detailMock.mockResolvedValue(withRef("https://youtu.be/GIg5wcr_a-A"))
        const yt = renderHook(() => useQueryLearnLessonSwr("khoa-youtube", "l1"))
        await waitFor(() => expect(yt.result.current.lesson).toBeTruthy())
        expect(yt.result.current.lesson?.hasVideo).toBe(true)
    })

    it("link Drive vẫn KHÔNG thành player (giữ nguyên nhánh tài liệu)", async () => {
        detailMock.mockResolvedValue(withRef("https://drive.google.com/drive/folders/abc"))
        const { result } = renderHook(() => useQueryLearnLessonSwr("khoa-drive", "l1"))
        await waitFor(() => expect(result.current.lesson).toBeTruthy())
        expect(result.current.lesson?.hasVideo).toBe(false)
        expect(result.current.lesson?.externalRef).toBe("https://drive.google.com/drive/folders/abc")
    })
})
