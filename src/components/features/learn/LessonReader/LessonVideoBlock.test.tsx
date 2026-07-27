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

describe("LessonVideoBlock — player dispatch", () => {
    beforeEach(() => {
        currentStream = undefined
        hlsProps.mockClear()
        ytProps.mockClear()
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

    it("falls back to the legacy video_* token HLS mode when provider is not HLS", () => {
        currentStream = { url: "", provider: undefined, mode: "FULL", previewSeconds: 0 }
        render(<LessonVideoBlock {...baseProps} videoRef="video_abc123" />)

        expect(screen.getByTestId("hls-player")).toBeTruthy()
        const props = hlsProps.mock.calls[0][0]
        expect(props.videoRef).toBe("video_abc123")
        expect(props.manifestUrl).toBeUndefined()
    })
})
