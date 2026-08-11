import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StreamViewResponse } from "@/modules/api/rest/course/types"

/**
 * Component — LessonVideoBlock player dispatch (C3 signed-HLS-manifest support).
 *
 * The block must mount an HLS player DIRECTLY on `stream.url` when the BE ships a
 * signed manifest (`provider === "HLS"`, `videoRef` null), ahead of the ref-based
 * dispatch — while keeping the YouTube ref and legacy `video_*` token paths intact.
 */

let currentStream: Partial<StreamViewResponse> | undefined
vi.mock("./hooks/useLessonStreamSwr", () => ({
    useLessonStreamSwr: () => ({ stream: currentStream, isLoading: false }),
}))

vi.mock("./hooks/usePreviewGate", () => ({
    usePreviewGate: () => ({
        timeRemaining: 0,
        isGated: false,
        onTimeUpdate: vi.fn(),
        onEnded: vi.fn(),
    }),
}))

// The up-next hand-off pushes through the next-intl router; its real module pulls
// `next/navigation` through next-intl's ESM build, which does not resolve under vitest.
const push = vi.fn()
vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push }),
}))

const hlsProps = vi.fn()
vi.mock("./LessonHlsPlayer", () => ({
    LessonHlsPlayer: (props: Record<string, unknown>) => {
        hlsProps(props)
        return <div data-testid="hls-player" />
    },
}))

const ytProps = vi.fn()
vi.mock("./LessonYouTubePlayer", () => ({
    LessonYouTubePlayer: (props: Record<string, unknown>) => {
        ytProps(props)
        return <div data-testid="yt-player" />
    },
}))

vi.mock("@/components/features/course/PackageGateModal", () => ({
    PackageGateModal: () => null,
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: () => <div data-testid="skeleton" />,
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@phosphor-icons/react", () => ({
    LockSimpleIcon: () => null,
    // Used by the up-next overlay, which this block now renders inside the player.
    CaretRightIcon: () => null,
    XIcon: () => null,
}))

vi.mock("@heroui/react", () => ({
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Button: ({ children }: { children?: React.ReactNode }) => <button type="button">{children}</button>,
}))

import { LessonVideoBlock } from "./LessonVideoBlock"

const baseProps = {
    courseId: "c1",
    lessonId: "l1",
    courseRawId: "raw1",
    courseTitle: "Course",
    lessonTitle: "Lesson",
    packageSlugs: [],
    videoRef: null,
}

/** Where a finished video hands off (this lesson's challenge, else the next lesson). */
const upNextLesson = {
    href: "/courses/c1/learn/content/modules/m1/contents/l2",
    title: "Bài 2",
    kind: "lesson" as const,
}

describe("LessonVideoBlock — player dispatch", () => {
    beforeEach(() => {
        currentStream = undefined
        hlsProps.mockClear()
        ytProps.mockClear()
        push.mockClear()
    })

    it("mounts the HLS player directly on stream.url when provider is HLS (videoRef null)", () => {
        currentStream = {
            url: "https://cdn.example.com/signed/master.m3u8?token=abc",
            provider: "HLS",
            mode: "FULL",
            previewSeconds: 0,
            videoRef: null,
        }
        render(<LessonVideoBlock {...baseProps} />)

        expect(screen.getByTestId("hls-player")).toBeTruthy()
        expect(screen.queryByTestId("yt-player")).toBeNull()
        const props = hlsProps.mock.calls[0][0]
        expect(props.manifestUrl).toBe("https://cdn.example.com/signed/master.m3u8?token=abc")
        expect(props.videoRef).toBeUndefined()
        // Preview-gate/clamp props are preserved on the direct-URL player.
        expect(typeof props.onTimeUpdate).toBe("function")
        expect(typeof props.onEnded).toBe("function")
        expect("isGated" in props).toBe(true)
    })

    it("falls back to the YouTube player for a YouTube catalog ref", () => {
        currentStream = { url: "", mode: "FULL", previewSeconds: 0, videoRef: null }
        render(
            <LessonVideoBlock
                {...baseProps}
                videoRef="https://youtu.be/dQw4w9WgXcQ"
            />,
        )

        expect(screen.getByTestId("yt-player")).toBeTruthy()
        expect(screen.queryByTestId("hls-player")).toBeNull()
    })

    it("falls back to the legacy video_* token HLS mode when provider is HLS but url is null", () => {
        // Real BE shape for a migrated stream.ftes.vn stream: provider "HLS" with NO signed
        // manifest (`url: null`) and the token in `videoRef`. The direct-manifest branch must
        // skip on the null url and fall through to the legacy token mode.
        currentStream = {
            url: null,
            provider: "HLS",
            mode: "FULL",
            previewSeconds: 0,
            videoRef: "video_abc123",
        }
        render(<LessonVideoBlock {...baseProps} />)

        expect(screen.getByTestId("hls-player")).toBeTruthy()
        const props = hlsProps.mock.calls[0][0]
        expect(props.videoRef).toBe("video_abc123")
        expect(props.manifestUrl).toBeUndefined()
    })
})

/**
 * The "up next" hand-off wiring. The block is the only place that knows BOTH the
 * preview/gated state and which player is mounted, so it decides whether the feature is
 * live at all. The freemium exclusion is the load-bearing case: a PREVIEW video is CUT
 * OFF at `previewSeconds`, so its `ended` is the paywall, never "finished the lesson".
 */
describe("LessonVideoBlock — up-next hand-off", () => {
    beforeEach(() => {
        currentStream = undefined
        hlsProps.mockClear()
        ytProps.mockClear()
        push.mockClear()
    })

    it("tracks the YouTube video to its end when a destination exists on a FULL stream", () => {
        currentStream = { url: "", mode: "FULL", previewSeconds: 0, videoRef: null }
        render(
            <LessonVideoBlock
                {...baseProps}
                videoRef="https://youtu.be/dQw4w9WgXcQ"
                upNext={upNextLesson}
            />,
        )

        const props = ytProps.mock.calls[0][0]
        // The last-10s window sits past the ≥50% mark where the poll would otherwise stop.
        expect(props.trackToEnd).toBe(true)
        // Nothing to show until playback actually reaches the window.
        expect(props.overlay).toBeNull()
    })

    it("stays OFF on a PREVIEW stream even with a destination", () => {
        currentStream = { url: "", mode: "PREVIEW", previewSeconds: 90, videoRef: null }
        render(
            <LessonVideoBlock
                {...baseProps}
                videoRef="https://youtu.be/dQw4w9WgXcQ"
                upNext={upNextLesson}
            />,
        )

        expect(ytProps.mock.calls[0][0].trackToEnd).toBe(false)
        expect(push).not.toHaveBeenCalled()
    })

    it("stays OFF when there is nowhere to go (last lesson, no challenge)", () => {
        currentStream = { url: "", mode: "FULL", previewSeconds: 0, videoRef: null }
        render(
            <LessonVideoBlock
                {...baseProps}
                videoRef="https://youtu.be/dQw4w9WgXcQ"
                upNext={null}
            />,
        )

        const props = ytProps.mock.calls[0][0]
        expect(props.trackToEnd).toBe(false)
        expect(props.overlay).toBeNull()
    })
})
