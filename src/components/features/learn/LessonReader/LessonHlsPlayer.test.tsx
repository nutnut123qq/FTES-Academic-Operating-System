import React from "react"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type HlsHandler = (event: string, data: Record<string, unknown>) => void

const h = vi.hoisted(() => ({
    instance: null as null | {
        config: Record<string, number | boolean>
        emit: (event: string, data: Record<string, unknown>) => void
        recoverMediaError: ReturnType<typeof vi.fn>
        startLoad: ReturnType<typeof vi.fn>
    },
}))

vi.mock("hls.js", () => {
    class MockHls {
        static Events = {
            LEVEL_LOADED: "level-loaded",
            FRAG_LOADED: "frag-loaded",
            FRAG_BUFFERED: "frag-buffered",
            ERROR: "error",
        }

        static ErrorTypes = {
            NETWORK_ERROR: "networkError",
            MEDIA_ERROR: "mediaError",
        }

        static isSupported = () => true

        config: Record<string, number | boolean>
        handlers = new Map<string, Array<HlsHandler>>()
        recoverMediaError = vi.fn()
        startLoad = vi.fn()
        loadSource = vi.fn()
        attachMedia = vi.fn()
        destroy = vi.fn()

        constructor(config: Record<string, number | boolean>) {
            this.config = { ...config }
            h.instance = this
        }

        on(event: string, handler: HlsHandler) {
            const handlers = this.handlers.get(event) ?? []
            handlers.push(handler)
            this.handlers.set(event, handlers)
        }

        emit(event: string, data: Record<string, unknown>) {
            this.handlers.get(event)?.forEach((handler) => handler(event, data))
        }
    }

    return { default: MockHls }
})

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    Button: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
    Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowClockwiseIcon: () => <span />,
    VideoCameraSlashIcon: () => <span />,
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: () => <div data-testid="startup-loading" />,
}))

vi.mock("./hooks/useWatchPositionReporter", () => ({
    useWatchPositionReporter: () => ({
        onPaused: vi.fn(),
        onPlaying: vi.fn(),
        onSeeked: vi.fn(),
    }),
}))

import { LessonHlsPlayer } from "./LessonHlsPlayer"

const renderPlayer = () => render(
    <LessonHlsPlayer
        manifestUrl="https://video.example/master.m3u8"
        lessonId="lesson-1"
        isGated={false}
        onTimeUpdate={vi.fn()}
        onEnded={vi.fn()}
    />,
)

beforeEach(() => {
    h.instance = null
    vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue("")
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe("LessonHlsPlayer startup buffering", () => {
    it("keeps loading until metadata and five distinct media fragments are buffered", async () => {
        const { container } = renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!
        const video = container.querySelector("video")!

        act(() => {
            instance.emit("level-loaded", {
                details: {
                    targetduration: 6,
                    fragments: Array.from({ length: 8 }, () => ({ duration: 6 })),
                },
            })
        })
        expect(instance.config.startFragPrefetch).toBe(true)
        expect(instance.config.maxBufferLength).toBe(31)

        fireEvent.loadedMetadata(video)
        for (let sn = 0; sn < 4; sn += 1) {
            act(() => {
                instance.emit("frag-buffered", { frag: { type: "main", level: 0, sn } })
            })
        }
        expect(screen.getByTestId("startup-loading")).toBeTruthy()

        act(() => {
            instance.emit("frag-buffered", { frag: { type: "main", level: 0, sn: 4 } })
        })
        await waitFor(() => expect(screen.queryByTestId("startup-loading")).toBeNull())
    })

    it("does not count duplicate or audio fragments toward the five-segment gate", async () => {
        const { container } = renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!
        fireEvent.loadedMetadata(container.querySelector("video")!)

        act(() => {
            instance.emit("frag-buffered", { frag: { type: "main", level: 0, sn: 0 } })
            instance.emit("frag-buffered", { frag: { type: "main", level: 0, sn: 0 } })
            instance.emit("frag-buffered", { frag: { type: "audio", level: 0, sn: 1 } })
        })

        expect(screen.getByTestId("startup-loading")).toBeTruthy()
    })

    it("recovers MediaSource when a downloaded segment never produces metadata", async () => {
        renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!
        vi.useFakeTimers()

        act(() => {
            instance.emit("frag-loaded", { frag: { type: "main", level: 0, sn: 0 } })
            vi.advanceTimersByTime(8000)
        })

        expect(instance.recoverMediaError).toHaveBeenCalledTimes(1)
        expect(instance.startLoad).toHaveBeenCalledWith(-1)
    })
})
