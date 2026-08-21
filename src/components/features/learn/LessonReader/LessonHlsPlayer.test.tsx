import React from "react"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type HlsHandler = (event: string, data: Record<string, unknown>) => void

const h = vi.hoisted(() => ({
    instance: null as null | {
        config: Record<string, unknown>
        attachMedia: ReturnType<typeof vi.fn>
        loadSource: ReturnType<typeof vi.fn>
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
    getHlsErrorStatus: (data: { response?: { code?: number } }) => data.response?.code ?? null,
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
    it("attaches MediaSource before loading the manifest and lets hls.js start immediately", async () => {
        renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!

        expect(instance.attachMedia).toHaveBeenCalledTimes(1)
        expect(instance.loadSource).toHaveBeenCalledWith("https://video.example/master.m3u8")
        expect(instance.attachMedia.mock.invocationCallOrder[0])
            .toBeLessThan(instance.loadSource.mock.invocationCallOrder[0])
        expect(instance.config.autoStartLoad).toBe(true)
        expect(instance.config.startFragPrefetch).toBe(true)
    })

    it("prefers hls.js when desktop Chromium claims it can maybe play HLS natively", async () => {
        vi.mocked(HTMLMediaElement.prototype.canPlayType).mockReturnValue("maybe")

        const { container } = renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())

        const video = container.querySelector("video")!
        expect(h.instance!.attachMedia).toHaveBeenCalledWith(video)
        expect(h.instance!.loadSource).toHaveBeenCalledWith("https://video.example/master.m3u8")
        expect(video.getAttribute("src")).toBeNull()
    })

    it("exposes playback as soon as media metadata is ready while buffering ahead", async () => {
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
        expect(fetch).not.toHaveBeenCalled()
        expect(instance.config.maxBufferLength).toBe(60)

        fireEvent.loadedMetadata(video)
        await waitFor(() => expect(screen.queryByTestId("startup-loading")).toBeNull())
    })

    it("raises the forward-buffer target when five long fragments exceed sixty seconds", async () => {
        renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!

        act(() => {
            instance.emit("level-loaded", {
                details: {
                    targetduration: 15,
                    fragments: Array.from({ length: 8 }, () => ({ duration: 15 })),
                },
            })
        })

        expect(instance.config.maxBufferLength).toBe(76)
        expect(instance.config.maxMaxBufferLength).toBe(300)
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
