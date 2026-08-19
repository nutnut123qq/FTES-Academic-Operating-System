import { act, renderHook } from "@testing-library/react"
import { unstable_serialize } from "swr/infinite"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    INITIAL_BACKOFF_MS,
    useNotificationSseLifecycle,
} from "./useNotificationSseLifecycle"
import { buildMyNotificationsInfiniteKey } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsInfiniteSwr"
import type { NotificationBadge } from "@/modules/api/rest/notification/types"

// ---------------------------------------------------------------- module mocks

/** SWR global mutate spy (the hook's only SWR surface). */
const mutateMock = vi.fn()
vi.mock("swr", () => ({
    // the REAL swr/infinite (kept unmocked for unstable_serialize) default-imports
    // useSWR from this same module at module scope — the mock must provide it
    default: vi.fn(),
    useSWRConfig: () => ({ mutate: mutateMock }),
}))

/** Session state consumed via useAppSelector (auth flag + viewer) — set per test. */
let authenticated = true
/** The signed-in viewer's id — the SSE revalidation keys are scoped to it. */
let viewerId: string | null = "user-a"
interface MockState {
    keycloak: { authenticated: boolean }
    user: { user: { id: string } | null }
}
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: MockState) => unknown) =>
        selector({
            keycloak: { authenticated },
            user: { user: viewerId ? { id: viewerId } : null },
        }),
}))

const refreshMock = vi.fn(async () => "token-moi")
const shouldRefreshMock = vi.fn(() => false)

vi.mock("@/modules/api/rest/client/refresh", () => ({
    refreshAccessToken: (...a: Array<unknown>) => refreshMock(...(a as [])),
    shouldRefreshAccessToken: (...a: Array<unknown>) => shouldRefreshMock(...(a as [])),
    ACCESS_TOKEN_MIN_VALIDITY_SECONDS: 60,
}))

// ---------------------------------------------------------------- fetch stream harness

const encoder = new TextEncoder()

/** One mocked in-flight SSE request the test can drive. */
interface MockStream {
    /** Push raw SSE text down the response body. */
    emit: (text: string) => void
    /** Close the body (clean server close, e.g. the 30-min emitter timeout). */
    close: () => void
    /** The abort signal the hook passed to fetch. */
    signal: AbortSignal | undefined
    /** The headers the hook sent. */
    headers: Record<string, string>
}

let streams: Array<MockStream> = []
const fetchMock = vi.fn()

/** Queue a successful streaming response for the NEXT fetch call. */
const respondWithStream = () => {
    fetchMock.mockImplementationOnce((_url: string, init?: RequestInit) => {
        let controller!: ReadableStreamDefaultController<Uint8Array>
        const body = new ReadableStream<Uint8Array>({
            start: (c) => {
                controller = c
            },
        })
        streams.push({
            emit: (text) => controller.enqueue(encoder.encode(text)),
            close: () => controller.close(),
            signal: init?.signal ?? undefined,
            headers: (init?.headers ?? {}) as Record<string, string>,
        })
        return Promise.resolve({ ok: true, status: 200, body })
    })
}

/** Flush the microtask chain (fetch → reader.read → parser dispatch are all promise hops). */
const flushMicrotasks = async () => {
    await act(async () => {
        for (let i = 0; i < 20; i += 1) {
            await Promise.resolve()
        }
    })
}

// ---------------------------------------------------------------- lifecycle

beforeEach(() => {
    vi.useFakeTimers()
    authenticated = true
    viewerId = "user-a"
    streams = []
    mutateMock.mockReset()
    fetchMock.mockReset()
    refreshMock.mockClear()
    shouldRefreshMock.mockClear()
    shouldRefreshMock.mockReturnValue(false)
    // default: network failure — tests opt into streams with respondWithStream()
    fetchMock.mockRejectedValue(new Error("network down"))
    vi.stubGlobal("fetch", fetchMock)
    localStorage.setItem("keycloak:access_token", "test-token")
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    localStorage.clear()
})

describe("useNotificationSseLifecycle", () => {
    it("does not connect when unauthenticated", async () => {
        authenticated = false
        renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("opens the stream with a Bearer header against /notifications/stream", async () => {
        respondWithStream()
        renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [url] = fetchMock.mock.calls[0] as [string]
        expect(url).toMatch(/\/notifications\/stream$/)
        expect(streams[0]?.headers.Accept).toBe("text/event-stream")
        expect(streams[0]?.headers.Authorization).toMatch(/^Bearer /)
    })

    it("patches the badge unreadCount (no refetch) on an unread event", async () => {
        respondWithStream()
        renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()

        streams[0]?.emit("event:unread\ndata:4\n\n")
        await flushMicrotasks()

        const call = mutateMock.mock.calls.find(
            ([key]) => Array.isArray(key) && key[0] === "QUERY_MY_NOTIFICATIONS_SWR",
        )
        expect(call).toBeDefined()
        const [, updater, options] = call as [
            unknown,
            (current: NotificationBadge | null | undefined) => NotificationBadge | null | undefined,
            { revalidate: boolean },
        ]
        expect(options).toEqual({ revalidate: false })
        // patches an existing cache entry, leaves a cold cache untouched
        expect(updater({ items: [], unreadCount: 0 })).toEqual({ items: [], unreadCount: 4 })
        expect(updater(undefined)).toBeUndefined()
    })

    it("revalidates the bell + the notification-center infinite list on a notification event", async () => {
        respondWithStream()
        renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()
        mutateMock.mockClear()

        streams[0]?.emit("event:notification\ndata:{\"id\":\"n1\"}\n\nevent:unread\ndata:1\n\n")
        await flushMicrotasks()

        // full revalidation of the badge page (key WITHOUT updater/options)
        expect(
            mutateMock.mock.calls.some(
                ([key, updater]) =>
                    Array.isArray(key)
                    && key[0] === "QUERY_MY_NOTIFICATIONS_SWR"
                    && updater === undefined,
            ),
        ).toBe(true)
        // the center infinite list is revalidated via its serialized `$inf$` meta
        // keys (both unreadOnly variants) — a key-filter mutate would silently skip
        // `$inf$` keys in SWR, so the hook must target them directly. The expected key
        // comes from the LIST HOOK's exported builder, so this assertion goes red the
        // day the two sides drift apart (which is otherwise a silent no-op).
        for (const unreadOnly of [false, true]) {
            const expectedKey = unstable_serialize(
                buildMyNotificationsInfiniteKey(unreadOnly, "user-a"),
            )
            // guard: this really is the infinite meta key, not a page key
            expect(expectedKey).toMatch(/^\$inf\$/)
            expect(
                mutateMock.mock.calls.some(
                    ([key, updater]) => key === expectedKey && updater === undefined,
                ),
            ).toBe(true)
        }
        // and no function-matcher mutate remains (it was a silent no-op)
        expect(mutateMock.mock.calls.some(([key]) => typeof key === "function")).toBe(false)

        // the revalidated key belongs to THIS viewer only — another account's list key
        // is a different string and is never touched by this viewer's stream
        const otherViewerKey = unstable_serialize(
            buildMyNotificationsInfiniteKey(false, "user-b"),
        )
        expect(otherViewerKey).not.toBe(
            unstable_serialize(buildMyNotificationsInfiniteKey(false, "user-a")),
        )
        expect(mutateMock.mock.calls.some(([key]) => key === otherViewerKey)).toBe(false)
    })

    it("revalidates nothing while no viewer id has resolved yet", async () => {
        // authenticated, but the `me` query is still in flight. BOTH caches are now
        // viewer-scoped, so neither has an entry yet: the badge key and the list key are
        // both null. Pushing an unscoped key here would not "refresh the bell", it would
        // create a stray cache entry no hook ever reads.
        viewerId = null
        respondWithStream()
        renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()
        mutateMock.mockClear()

        streams[0]?.emit("event:notification\ndata:{\"id\":\"n1\"}\n\n")
        await flushMicrotasks()

        expect(
            mutateMock.mock.calls.some(
                ([key]) => Array.isArray(key) && key[0] === "QUERY_MY_NOTIFICATIONS_SWR",
            ),
        ).toBe(false)
        expect(
            mutateMock.mock.calls.some(
                ([key]) => typeof key === "string" && key.startsWith("$inf$"),
            ),
        ).toBe(false)
    })

    it("reconnects with exponential backoff after failures", async () => {
        // 1st + 2nd attempts fail (default mockRejectedValue)
        renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledTimes(1)

        // first retry after INITIAL_BACKOFF_MS
        await act(() => vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS - 1))
        expect(fetchMock).toHaveBeenCalledTimes(1)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(fetchMock).toHaveBeenCalledTimes(2)

        // second retry doubles to 2 × INITIAL_BACKOFF_MS
        await act(() => vi.advanceTimersByTimeAsync(2 * INITIAL_BACKOFF_MS - 1))
        expect(fetchMock).toHaveBeenCalledTimes(2)
        await act(() => vi.advanceTimersByTimeAsync(1))
        expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it("resets the backoff once the stream delivers an event, then reconnects fast after a clean close", async () => {
        // fail twice → backoff grows to 4×; then a live stream resets it
        renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()
        await act(() => vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS))
        await act(() => vi.advanceTimersByTimeAsync(2 * INITIAL_BACKOFF_MS))
        expect(fetchMock).toHaveBeenCalledTimes(3)

        respondWithStream()
        await act(() => vi.advanceTimersByTimeAsync(4 * INITIAL_BACKOFF_MS))
        expect(fetchMock).toHaveBeenCalledTimes(4)
        streams[0]?.emit("event:unread\ndata:0\n\n")
        await flushMicrotasks()

        // clean server close (30-min emitter timeout) → next attempt after the RESET delay
        respondWithStream()
        streams[0]?.close()
        await flushMicrotasks()
        await act(() => vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS))
        expect(fetchMock).toHaveBeenCalledTimes(5)
    })

    it("aborts the stream and stops reconnecting on unmount", async () => {
        respondWithStream()
        const { unmount } = renderHook(() => useNotificationSseLifecycle())
        await flushMicrotasks()
        expect(streams[0]?.signal?.aborted).toBe(false)

        unmount()
        expect(streams[0]?.signal?.aborted).toBe(true)

        // no further attempts, however long we wait
        const calls = fetchMock.mock.calls.length
        await act(() => vi.advanceTimersByTimeAsync(10 * INITIAL_BACKOFF_MS))
        expect(fetchMock).toHaveBeenCalledTimes(calls)
    })

    it("token đã hết hạn ⇒ LÀM MỚI trước khi nối, không mang token chết đi", async () => {
        // Kịch bản thật đo được trên production: token sống 15 phút, người dùng để yên tab, không
        // lời gọi REST nào làm mới hộ ⇒ lúc stream nối lại thì token đã chết 13,4 phút.
        shouldRefreshMock.mockReturnValue(true)
        respondWithStream()

        renderHook(() => useNotificationSseLifecycle())
        await vi.advanceTimersByTimeAsync(0)

        expect(refreshMock).toHaveBeenCalled()
    })

    it("stream trả 401 ⇒ làm mới token TRƯỚC lần nối lại", async () => {
        // Không làm mới thì lần nối lại mang đúng token chết đó và nhận lại đúng 401 — thành vòng
        // lặp vô tận theo nhịp backoff, đúng thứ người dùng thấy trong tab Network.
        const { NotificationStreamHttpError } = await import(
            "@/modules/api/rest/notification/stream")
        fetchMock.mockRejectedValueOnce(new NotificationStreamHttpError(401))

        renderHook(() => useNotificationSseLifecycle())
        await vi.advanceTimersByTimeAsync(0)

        expect(refreshMock).toHaveBeenCalled()
    })

    it("refresh HỎNG cũng không làm vỡ vòng lặp nối lại", async () => {
        // Refresh token cũng hết hạn là chuyện có thật; ném ra ngoài ở đây sẽ giết luôn cơ chế
        // backoff và stream không bao giờ thử lại nữa.
        const { NotificationStreamHttpError } = await import(
            "@/modules/api/rest/notification/stream")
        fetchMock.mockRejectedValueOnce(new NotificationStreamHttpError(401))
        refreshMock.mockRejectedValueOnce(new Error("refresh token cũng hết hạn"))

        renderHook(() => useNotificationSseLifecycle())
        await expect(vi.advanceTimersByTimeAsync(2000)).resolves.not.toThrow()
    })
})
