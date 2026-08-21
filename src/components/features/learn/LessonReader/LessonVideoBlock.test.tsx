import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StreamViewResponse } from "@/modules/api/rest/course/types"

/**
 * Component — LessonVideoBlock player dispatch (C3 signed-HLS-manifest support).
 *
 * The block must mount an HLS player on `stream.url` when the BE ships a signed manifest
 * (`provider === "HLS"`), and keep the YouTube ref path intact. Load-bearing rule: a
 * self-hosted (`video_*` / `aosvideo:`) ref is NEVER resolved in the browser against the
 * old stream gateway — the source comes from the BE or the player shows its retry card.
 */

let currentStream: Partial<StreamViewResponse> | undefined
let currentLoading = false
const mutateStream = vi.fn()
vi.mock("./hooks/useLessonStreamSwr", () => ({
    useLessonStreamSwr: () => ({
        stream: currentStream,
        isLoading: currentLoading,
        mutate: mutateStream,
    }),
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
        currentLoading = false
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

    it("never hands a legacy video_* token to the player when the BE gave no url", () => {
        // BE shape when no playback ticket could be issued: provider "HLS" with NO signed
        // manifest (`url: null`) and the token in `videoRef`. The player must be mounted
        // WITHOUT a source (→ its error card + retry, which re-asks the BE); the token must
        // never be passed down, because that is what used to make the browser call the old
        // stream gateway directly, around the BE and around the paywall.
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
        expect(props.videoRef).toBeUndefined()
        expect(props.manifestUrl).toBeNull()
        // Retry path exists, and it goes back to the BE.
        expect(typeof props.onRefreshSource).toBe("function")
    })

    it("holds a skeleton while the stream call is in flight for a self-hosted catalog ref", () => {
        // The catalog ref arrives BEFORE the stream response. Mounting a player on it is
        // exactly the race that fired a browser request to the stream gateway on every
        // legacy lesson, so nothing may mount until the BE answers.
        currentLoading = true
        currentStream = undefined
        render(<LessonVideoBlock {...baseProps} videoRef="video_abc123" />)

        expect(screen.getByTestId("skeleton")).toBeTruthy()
        expect(screen.queryByTestId("hls-player")).toBeNull()
        expect(hlsProps).not.toHaveBeenCalled()
    })

    it("still mounts the YouTube embed from the catalog ref while the stream loads", () => {
        // YouTube needs no signed manifest, so it must NOT be held back by the stream call.
        currentLoading = true
        currentStream = undefined
        render(<LessonVideoBlock {...baseProps} videoRef="https://youtu.be/dQw4w9WgXcQ" />)

        expect(screen.getByTestId("yt-player")).toBeTruthy()
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
        currentLoading = false
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
