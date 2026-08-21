import React from "react"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type HlsHandler = (event: string, data: Record<string, unknown>) => void

const h = vi.hoisted(() => ({
    instance: null as null | {
        config: Record<string, unknown>
        attachMedia: ReturnType<typeof vi.fn>
        emit: (event: string, data: Record<string, unknown>) => void
        recoverMediaError: ReturnType<typeof vi.fn>
        startLoad: ReturnType<typeof vi.fn>
    },
}))

vi.mock("hls.js", () => {
    class MockLoader {
        context = null
        stats = {}
        abort = vi.fn()
        destroy = vi.fn()
        load = vi.fn()
    }

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
        static DefaultConfig = { loader: MockLoader }

        config: Record<string, unknown>
        handlers = new Map<string, Array<HlsHandler>>()
        recoverMediaError = vi.fn()
        startLoad = vi.fn()
        loadSource = vi.fn()
        attachMedia = vi.fn()
        destroy = vi.fn()

        constructor(config: Record<string, unknown>) {
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

vi.mock("./hlsVodManifest", () => ({
    getHlsUrlTokenExpiryMs: () => null,
    prepareHlsVodManifestSource: (url: string) => Promise.resolve({
        url,
        expiresAtMs: null,
        dispose: vi.fn(),
    }),
}))

import { LessonHlsPlayer } from "./LessonHlsPlayer"

const renderPlayer = (onRefreshSource?: () => Promise<unknown> | void) => render(
    <LessonHlsPlayer
        manifestUrl="https://video.example/master.m3u8"
        lessonId="lesson-1"
        isGated={false}
        onTimeUpdate={vi.fn()}
        onEnded={vi.fn()}
        onRefreshSource={onRefreshSource}
    />,
)

beforeEach(() => {
    h.instance = null
    vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue("")
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(16)),
    }))
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe("LessonHlsPlayer startup buffering", () => {
    it("does not attach MediaSource until all five parallel prefetches settle", async () => {
        const responses: Array<(value: unknown) => void> = []
        vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => responses.push(resolve))))
        renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!

        act(() => {
            instance.emit("level-loaded", {
                details: {
                    targetduration: 5,
                    fragments: Array.from({ length: 5 }, (_, index) => ({
                        duration: 4.166667,
                        byteRange: [],
                        url: `https://video.example/seg_${index}.ts`,
                    })),
                },
            })
        })
        expect(fetch).toHaveBeenCalledTimes(5)
        expect(instance.attachMedia).not.toHaveBeenCalled()
        expect(instance.startLoad).not.toHaveBeenCalled()

        responses.forEach((resolve, index) => resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new Uint8Array([index]).buffer),
        }))
        await waitFor(() => expect(instance.attachMedia).toHaveBeenCalledTimes(1))
        expect(instance.startLoad).toHaveBeenCalledWith(0)
    })

    it("keeps loading until metadata and five distinct media fragments are buffered", async () => {
        const { container } = renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!
        const video = container.querySelector("video")!

        act(() => {
            instance.emit("level-loaded", {
                details: {
                    targetduration: 6,
                    fragments: Array.from({ length: 8 }, (_, index) => ({
                        duration: 6,
                        byteRange: [],
                        url: `https://video.example/seg_${index}.ts`,
                    })),
                },
            })
        })
        await waitFor(() => expect(instance.startLoad).toHaveBeenCalledWith(0))
        expect(fetch).toHaveBeenCalledTimes(5)
        expect(instance.config.startFragPrefetch).toBe(false)
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
        expect(instance.startLoad).toHaveBeenCalledWith(0)
    })

    it("requests a freshly signed stream when the CDN rejects a segment grant", async () => {
        const refreshSource = vi.fn().mockResolvedValue(undefined)
        renderPlayer(refreshSource)
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!

        act(() => {
            instance.emit("error", {
                type: "networkError",
                fatal: false,
                response: { code: 403 },
            })
        })

        await waitFor(() => expect(refreshSource).toHaveBeenCalledTimes(1))
    })
})
