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
 */

type SwrCall = { key: unknown; fetcher: (() => unknown) | undefined; config: Record<string, unknown> | undefined }

const swrCalls: Array<SwrCall> = []

vi.mock("swr", () => ({
    default: (key: unknown, fetcher: (() => unknown) | undefined, config: Record<string, unknown> | undefined) => {
        swrCalls.push({ key, fetcher, config })
        return { data: undefined, error: undefined, isLoading: false, mutate: vi.fn() }
    },
}))

// useAppSelector applies the caller's selector to a controllable fake state.
let authenticated = false
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { keycloak: { authenticated: boolean } }) => unknown) =>
        selector({ keycloak: { authenticated } }),
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

    it("uses a stable key and 60s refreshInterval when authenticated", () => {
        authenticated = true
        renderHook(() => useGetMyQuestsSwr())
        expect(lastCall().key).toEqual(["GET_MY_QUESTS_SWR"])
        expect(lastCall().config).toMatchObject({ refreshInterval: 60_000 })
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

    it("defaults to a 12-week key when authenticated", () => {
        authenticated = true
        renderHook(() => useGetMyActivityDaysSwr())
        expect(lastCall().key).toEqual(["GET_MY_ACTIVITY_DAYS_SWR", 12])
    })

    it("polls on a 60s refreshInterval so the heatmap is not frozen under the global no-focus-revalidate provider", () => {
        authenticated = true
        renderHook(() => useGetMyActivityDaysSwr())
        expect(lastCall().config).toMatchObject({ refreshInterval: 60_000 })
    })

    it("puts the weeks window in the key so windows cache apart", () => {
        authenticated = true
        renderHook(() => useGetMyActivityDaysSwr(4))
        expect(lastCall().key).toEqual(["GET_MY_ACTIVITY_DAYS_SWR", 4])
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

    it("uses a stable key when authenticated", () => {
        authenticated = true
        renderHook(() => useGetMyProgressionSwr())
        expect(lastCall().key).toEqual(["GET_MY_PROGRESSION_SWR"])
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
