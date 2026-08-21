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

const windowPolicy = vi.hoisted(() => ({ current: null as null | { leadSeconds: number; ttlSeconds: number } }))
const preparedUrls = vi.hoisted(() => [] as Array<string>)
vi.mock("./hlsVodManifest", () => ({
    getHlsErrorStatus: (data: { response?: { code?: number } }) => data.response?.code ?? null,
    getHlsUrlTokenExpiryMs: () => null,
    // Bản thật chỉ gắn `at` cho URL của stream service (nhận ra bằng `grant`); giữ đúng luật đó ở
    // đây, nếu không thì test sẽ "xanh" cả với URL ký thẳng từ kho — đúng ca làm hỏng chữ ký S3.
    withPlaybackAnchor: (url: string, seconds: number) => {
        const parsed = new URL(url)
        if (!parsed.searchParams.has("grant")) return url
        parsed.searchParams.set("at", String(Math.max(0, Math.floor(seconds))))
        return parsed.href
    },
    prepareHlsVodManifestSource: (url: string) => {
        preparedUrls.push(url)
        return Promise.resolve({
            url,
            expiresAtMs: null,
            windowPolicy: windowPolicy.current,
            dispose: vi.fn(),
        })
    },
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
    windowPolicy.current = null
    preparedUrls.length = 0
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

    it("xin vé mới khi hạn ngạch manifest theo vé đã hết (429), không bỏ mặc người xem", async () => {
        // Stream service giới hạn số lần MỘT vé được đổi lấy manifest (chống tải hàng loạt). Người
        // tua nhiều có thể chạm trần thật; với họ cách chữa giống hệt vé hết hạn — xin BE cấp vé
        // mới. Không xử lý 429 thì họ gặp thẻ "video lỗi" giữa bài.
        const refreshSource = vi.fn().mockResolvedValue(undefined)
        renderPlayer(refreshSource)
        await waitFor(() => expect(h.instance).toBeTruthy())
        const instance = h.instance!

        act(() => {
            instance.emit("error", {
                type: "networkError",
                fatal: false,
                response: { code: 429 },
            })
        })

        await waitFor(() => expect(refreshSource).toHaveBeenCalledTimes(1))
    })
})

/**
 * Source of truth for the playable URL. The player takes the manifest the BE signed and
 * nothing else — it must never resolve a `video_*` token against the old stream gateway
 * (`stream.ftes.vn/api/videos/{ref}/playlist`), because that URL has no expiry and is gated
 * only by `Referer`, which is exactly what the per-segment signing exists to prevent.
 */
describe("LessonHlsPlayer source", () => {
    it("loads the BE-signed manifest and never calls the stream gateway", async () => {
        renderPlayer()
        await waitFor(() => expect(h.instance).toBeTruthy())

        expect(h.instance!.loadSource).toHaveBeenCalledWith("https://video.example/master.m3u8")
        const requested = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls
            .map(([input]) => String(input))
        expect(requested.some((url) => url.includes("stream.ftes.vn"))).toBe(false)
    })

    it("shows the retry card instead of resolving anything when the BE gave no url", async () => {
        render(
            <LessonHlsPlayer
                manifestUrl={null}
                lessonId="lesson-1"
                isGated={false}
                onTimeUpdate={vi.fn()}
                onEnded={vi.fn()}
                onRefreshSource={vi.fn()}
            />,
        )

        expect(await screen.findByText("reader.videoUnavailable")).toBeTruthy()
        expect(h.instance).toBeNull()
        const requested = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls
            .map(([input]) => String(input))
        expect(requested.some((url) => url.includes("stream.ftes.vn"))).toBe(false)
    })
})

/**
 * TUA. Stream service ký token theo cửa sổ bám tiến độ xem, nên tua ra ngoài cửa sổ đã ký thì
 * segment ở đó CHƯA có hiệu lực. Trình phát phải tự xin manifest neo lại tại chỗ vừa tua — đợi CDN
 * trả 403 rồi mới chữa thì người xem thấy video đứng hình trước, và mỗi lần như vậy còn tiêu một
 * lượt trong hạn ngạch chống-tải của server.
 */
describe("LessonHlsPlayer seeking", () => {
    const renderAnchored = () => render(
        <LessonHlsPlayer
            manifestUrl="https://streamtest.ftes.vn/api/v1/stream/video_x/master.m3u8?grant=abc"
            lessonId="lesson-1"
            isGated={false}
            onTimeUpdate={vi.fn()}
            onEnded={vi.fn()}
            onRefreshSource={vi.fn()}
        />,
    )

    const seekTo = (seconds: number) => {
        const video = document.querySelector("video") as HTMLVideoElement
        Object.defineProperty(video, "currentTime", { value: seconds, configurable: true })
        fireEvent.seeked(video)
    }

    it("mở bài thì neo ở mốc 0", async () => {
        renderAnchored()
        await waitFor(() => expect(h.instance).toBeTruthy())

        expect(preparedUrls.at(-1)).toContain("at=0")
    })

    it("tua xa quá cửa sổ đã ký → xin manifest neo lại tại chỗ vừa tua", async () => {
        windowPolicy.current = { leadSeconds: 120, ttlSeconds: 120 }
        renderAnchored()
        await waitFor(() => expect(h.instance).toBeTruthy())

        seekTo(1200)

        await waitFor(() => expect(preparedUrls.at(-1)).toContain("at=1200"))
        // Và nạp lại phải quay về đúng chỗ đang xem, không nhảy về 0:00.
        expect(h.instance!.config.startPosition).toBe(1200)
    })

    it("tua ngắn TRONG cửa sổ thì không nạp lại gì cả", async () => {
        windowPolicy.current = { leadSeconds: 120, ttlSeconds: 120 }
        renderAnchored()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const loadsBefore = preparedUrls.length

        seekTo(30)

        expect(preparedUrls).toHaveLength(loadsBefore)
    })

    it("server chưa công bố cửa sổ → không tự neo lại (đường 403 lo)", async () => {
        windowPolicy.current = null
        renderAnchored()
        await waitFor(() => expect(h.instance).toBeTruthy())
        const loadsBefore = preparedUrls.length

        seekTo(3600)

        expect(preparedUrls).toHaveLength(loadsBefore)
    })

    it("tạm dừng lâu rồi phát tiếp → neo lại trước khi CDN kịp từ chối", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        windowPolicy.current = { leadSeconds: 120, ttlSeconds: 120 }
        render(
            <LessonHlsPlayer
                manifestUrl="https://streamtest.ftes.vn/api/v1/stream/video_x/master.m3u8?grant=abc"
                lessonId="lesson-1"
                isGated={false}
                onTimeUpdate={vi.fn()}
                onEnded={vi.fn()}
                onRefreshSource={vi.fn()}
            />,
        )
        await waitFor(() => expect(h.instance).toBeTruthy())
        const video = document.querySelector("video") as HTMLVideoElement
        Object.defineProperty(video, "currentTime", { value: 90, configurable: true })

        fireEvent.pause(video)
        vi.advanceTimersByTime(5 * 60 * 1000)
        fireEvent.play(video)

        await waitFor(() => expect(preparedUrls.at(-1)).toContain("at=90"))
    })

    it("tạm dừng ngắn thì phát tiếp ngay, không nạp lại", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        windowPolicy.current = { leadSeconds: 120, ttlSeconds: 120 }
        render(
            <LessonHlsPlayer
                manifestUrl="https://streamtest.ftes.vn/api/v1/stream/video_x/master.m3u8?grant=abc"
                lessonId="lesson-1"
                isGated={false}
                onTimeUpdate={vi.fn()}
                onEnded={vi.fn()}
                onRefreshSource={vi.fn()}
            />,
        )
        await waitFor(() => expect(h.instance).toBeTruthy())
        const video = document.querySelector("video") as HTMLVideoElement
        const loadsBefore = preparedUrls.length

        fireEvent.pause(video)
        vi.advanceTimersByTime(10_000)
        fireEvent.play(video)

        expect(preparedUrls).toHaveLength(loadsBefore)
    })
})

