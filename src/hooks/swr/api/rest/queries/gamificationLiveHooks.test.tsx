import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the three live gamification SWR hooks added by change
 * `quest-board-streak-live` (task 1.3): `useGetMyQuestsSwr`,
 * `useGetMyActivityDaysSwr`, `useGetMyProgressionSwr`.
 *
 * `swr` is mocked to capture the `(key, fetcher, config)` triple each hook
 * passes, and `@/redux/hooks` drives the keycloak `authenticated` flag. This
 * pins the guarantees the spec cares about without a live backend:
 *  - guests key to `null` → SWR fires no request (`data === undefined`),
 *  - authenticated viewers get the documented stable key,
 *  - the fetcher delegates to the matching client fn,
 *  - the quest board polls on a 60s `refreshInterval`,
 *  - the activity-days window is part of the key so windows cache apart.
 *
 * The keys now also carry the VIEWER ID, so the fake state has a `user` slice too —
 * see `gamificationViewerScopedSwrKey.test.tsx` for the cross-user leak this closes.
 */

type SwrCall = { key: unknown; fetcher: (() => unknown) | undefined; config: Record<string, unknown> | undefined }

const swrCalls: Array<SwrCall> = []

vi.mock("swr", () => ({
    default: (key: unknown, fetcher: (() => unknown) | undefined, config: Record<string, unknown> | undefined) => {
        swrCalls.push({ key, fetcher, config })
        return { data: undefined, error: undefined, isLoading: false, mutate: vi.fn() }
    },
}))

// useAppSelector applies the caller's selector to a controllable fake state —
// both the session flag AND the viewer identity the keys are scoped to.
let authenticated = false
let viewerId: string | null = "viewer-1"
type FakeState = { keycloak: { authenticated: boolean }; user: { user: { id: string } | null } }
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: FakeState) => unknown) =>
        selector({
            keycloak: { authenticated },
            user: { user: viewerId === null ? null : { id: viewerId } },
        }),
}))

const getMyQuests = vi.fn()
const getMyActivityDays = vi.fn()
const getMyProgression = vi.fn()
vi.mock("@/modules/api/rest/gamification", () => ({
    getMyQuests: (...a: Array<unknown>) => getMyQuests(...a),
    getMyActivityDays: (...a: Array<unknown>) => getMyActivityDays(...a),
    getMyProgression: (...a: Array<unknown>) => getMyProgression(...a),
}))

import { useGetMyActivityDaysSwr } from "./useGetMyActivityDaysSwr"
import { useGetMyProgressionSwr } from "./useGetMyProgressionSwr"
import { useGetMyQuestsSwr } from "./useGetMyQuestsSwr"

const lastCall = () => swrCalls[swrCalls.length - 1]

beforeEach(() => {
    swrCalls.length = 0
    authenticated = false
    viewerId = "viewer-1"
    getMyQuests.mockReset()
    getMyActivityDays.mockReset()
    getMyProgression.mockReset()
})

describe("useGetMyQuestsSwr", () => {
    it("keys to null for a guest (no request fired)", () => {
        authenticated = false
        renderHook(() => useGetMyQuestsSwr())
        expect(lastCall().key).toBeNull()
    })

    it("uses a stable viewer-scoped key and 60s refreshInterval when authenticated", () => {
        authenticated = true
        renderHook(() => useGetMyQuestsSwr())
        expect(lastCall().key).toEqual(["GET_MY_QUESTS_SWR", "viewer-1"])
        expect(lastCall().config).toMatchObject({ refreshInterval: 60_000 })
    })

    it("keys to null while the session flag is on but the viewer has not hydrated", () => {
        authenticated = true
        viewerId = null
        renderHook(() => useGetMyQuestsSwr())
        expect(lastCall().key).toBeNull()
    })

    it("fetcher delegates to getMyQuests", () => {
        authenticated = true
        renderHook(() => useGetMyQuestsSwr())
        lastCall().fetcher?.()
        expect(getMyQuests).toHaveBeenCalledTimes(1)
    })

    it("returns undefined data for a guest", () => {
        authenticated = false
        const { result } = renderHook(() => useGetMyQuestsSwr())
        expect(result.current.data).toBeUndefined()
    })
})

describe("useGetMyActivityDaysSwr", () => {
    it("keys to null for a guest", () => {
        authenticated = false
        renderHook(() => useGetMyActivityDaysSwr())
        expect(lastCall().key).toBeNull()
    })

    it("defaults to a 12-week viewer-scoped key when authenticated", () => {
        authenticated = true
        renderHook(() => useGetMyActivityDaysSwr())
        expect(lastCall().key).toEqual(["GET_MY_ACTIVITY_DAYS_SWR", "viewer-1", 12])
    })

    it("polls on a 60s refreshInterval so the heatmap is not frozen under the global no-focus-revalidate provider", () => {
        authenticated = true
        renderHook(() => useGetMyActivityDaysSwr())
        expect(lastCall().config).toMatchObject({ refreshInterval: 60_000 })
    })

    it("puts the weeks window in the key so windows cache apart", () => {
        authenticated = true
        renderHook(() => useGetMyActivityDaysSwr(4))
        expect(lastCall().key).toEqual(["GET_MY_ACTIVITY_DAYS_SWR", "viewer-1", 4])
    })

    it("fetcher forwards the weeks window to getMyActivityDays", () => {
        authenticated = true
        renderHook(() => useGetMyActivityDaysSwr(4))
        lastCall().fetcher?.()
        expect(getMyActivityDays).toHaveBeenCalledWith({ weeks: 4 })
    })
})

describe("useGetMyProgressionSwr", () => {
    it("keys to null for a guest", () => {
        authenticated = false
        renderHook(() => useGetMyProgressionSwr())
        expect(lastCall().key).toBeNull()
    })

    it("uses a stable viewer-scoped key when authenticated", () => {
        authenticated = true
        renderHook(() => useGetMyProgressionSwr())
        expect(lastCall().key).toEqual(["GET_MY_PROGRESSION_SWR", "viewer-1"])
    })

    it("polls on a 60s refreshInterval so XP/level does not freeze under the global no-focus-revalidate provider", () => {
        authenticated = true
        renderHook(() => useGetMyProgressionSwr())
        expect(lastCall().config).toMatchObject({ refreshInterval: 60_000 })
    })

    it("fetcher delegates to getMyProgression", () => {
        authenticated = true
        renderHook(() => useGetMyProgressionSwr())
        lastCall().fetcher?.()
        expect(getMyProgression).toHaveBeenCalledTimes(1)
    })
})
