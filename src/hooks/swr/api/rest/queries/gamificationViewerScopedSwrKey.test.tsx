/**
 * Regression — the gamification / streak `/me/*` caches are scoped to ONE viewer.
 *
 * `["GET_MY_STREAK_SWR"]` (and every sibling key gated only on "is somebody signed
 * in") is the SAME cache entry for every account. Sign out of A and into B in the
 * SAME TAB and B's hook re-keys to that identical string, so SWR hands B the settled
 * entry it still holds for A — stale-while-revalidate paints A's streak/heatmap
 * instantly, and inside `dedupingInterval` the revalidation may not even run. Sign-out
 * through the button flushes the whole cache, but a REVOKED or EXPIRED session does
 * not: the key itself has to make the leak impossible, so it now carries the viewer id.
 *
 * Two failure modes are pinned here:
 *
 *  1. THE LEAK — B must not read A's cached answer (tests sign out WITHOUT flushing
 *     the SWR cache on purpose, mirroring the revoke/expiry path).
 *  2. THE SILENT BREAK — these keys are `mutate()`d from OTHER files (the streak
 *     popover revalidates streak + heatmap after a freeze is consumed). Changing the
 *     key without changing the call site does not throw: the mutate simply matches
 *     nothing and the UI quietly stops updating. So the exported key BUILDERS are
 *     pinned to their literal shape (that is what the popover's own test asserts
 *     against) AND a builder-built key is shown to actually revalidate the hook's
 *     cache entry — while the OLD hand-written key is shown to hit nothing.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig, useSWRConfig } from "swr"

const getMyStreak = vi.fn()
const getMyActivityDays = vi.fn()

vi.mock("@/modules/api/rest/gamification", () => ({
    getMyStreak: () => getMyStreak(),
    getMyActivityDays: (...args: Array<unknown>) => getMyActivityDays(...args),
    getMyProgression: vi.fn(),
    getMyQuests: vi.fn(),
    getMyBadges: vi.fn(),
    getMyGoals: vi.fn(),
}))

vi.mock("@/modules/api/rest/course", () => ({
    getMyLearnedLessons: vi.fn(),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { myStreakSwrKey, useGetMyStreakSwr } from "./useGetMyStreakSwr"
import { myActivityDaysSwrKey, useGetMyActivityDaysSwr } from "./useGetMyActivityDaysSwr"
import { myProgressionSwrKey } from "./useGetMyProgressionSwr"
import { myQuestsSwrKey } from "./useGetMyQuestsSwr"
import { myBadgesSwrKey } from "./useGetMyBadgesSwr"
import { myGoalsSwrKey } from "./useGetMyGoalsSwr"
import { myLearnedLessonsSwrKey } from "./useGetMyLearnedLessonsSwr"
import type { UserEntity } from "@/modules/types/entities/user"

/** Redux store (session + viewer) + an SWR cache private to this file. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
        <SWRConfig value={{
            provider: () => new Map(),
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            // Forced revalidation must not be swallowed by request dedupe — the
            // mutate-still-matches assertions below depend on the refetch running.
            dedupingInterval: 0,
        }}>
            {children}
        </SWRConfig>
    </Provider>
)

/*
 * Sign-in / sign-out use the SYNCHRONOUS `act` on purpose. Wrapping a redux dispatch
 * in `await act(async () => …)` makes React's async act queue swallow the SWR
 * revalidation the key change kicks off: the fetcher runs but its result never
 * reaches the hook's state, and every assertion below would fail for a reason that
 * has nothing to do with the leak under test.
 */

/** Sign a viewer in the way every real sign-in path does (flag + hydrated viewer). */
const signIn = (id: string) => {
    act(() => {
        store.dispatch(setAuthenticated(true))
        store.dispatch(setUser({ id } as UserEntity))
    })
}

/** Sign out the redux way only — no SWR cache flush (mirrors a revoked session). */
const signOut = () => {
    act(() => {
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })
}

/** One streak payload, distinguishable per user. */
const streakOf = (currentStreak: number) => ({
    currentStreak,
    longestStreak: currentStreak,
    lastActiveDate: "2026-08-15",
    freezeAvailable: 0,
})

beforeEach(() => {
    getMyStreak.mockReset()
    getMyActivityDays.mockReset()
    signOut()
})

describe("gamification key builders", () => {
    /*
     * The literal shapes. The streak popover's own test asserts `mutate` was called
     * with exactly these arrays, so this is the pivot that ties the call site to the
     * hooks: change a key here without changing the popover (or the reverse) and one
     * of the two files goes red.
     */
    it("scope every key to the viewer id", () => {
        expect(myStreakSwrKey("user-a")).toEqual(["GET_MY_STREAK_SWR", "user-a"])
        expect(myActivityDaysSwrKey("user-a", 12)).toEqual([
            "GET_MY_ACTIVITY_DAYS_SWR", "user-a", 12,
        ])
        expect(myProgressionSwrKey("user-a")).toEqual(["GET_MY_PROGRESSION_SWR", "user-a"])
        expect(myQuestsSwrKey("user-a")).toEqual(["GET_MY_QUESTS_SWR", "user-a"])
        expect(myBadgesSwrKey("user-a")).toEqual(["GET_MY_BADGES_SWR", "user-a"])
        expect(myGoalsSwrKey("user-a")).toEqual(["GET_MY_GOALS_SWR", "user-a"])
        expect(myLearnedLessonsSwrKey("user-a", 5)).toEqual([
            "GET_MY_LEARNED_LESSONS_SWR", "user-a", 5,
        ])
        expect(myLearnedLessonsSwrKey("user-a")).toEqual([
            "GET_MY_LEARNED_LESSONS_SWR", "user-a", null,
        ])
    })

    it("give two accounts two different keys", () => {
        expect(myStreakSwrKey("user-a")).not.toEqual(myStreakSwrKey("user-b"))
        expect(myActivityDaysSwrKey("user-a", 12)).not.toEqual(myActivityDaysSwrKey("user-b", 12))
    })
})

describe("gamification hooks — cache is scoped to the viewer", () => {
    it("does not serve user A's streak to user B in the same tab", async () => {
        getMyStreak.mockResolvedValue(streakOf(30))
        const { result } = renderHook(() => useGetMyStreakSwr(), { wrapper })

        // A signs in and their streak lands in the cache.
        signIn("user-a")
        await waitFor(() => expect(result.current.data?.currentStreak).toBe(30))

        signOut()

        // B's request is left hanging, so anything rendered for B can only have come
        // from the cache — which is exactly the leak under test.
        let releaseB: (streak: unknown) => void = () => undefined
        getMyStreak.mockImplementation(
            () => new Promise((resolve) => {
                releaseB = resolve
            }),
        )
        signIn("user-b")

        expect(result.current.data).toBeUndefined()

        // B's own answer, once it arrives, is what B sees.
        await act(async () => {
            releaseB(streakOf(2))
        })
        await waitFor(() => expect(result.current.data?.currentStreak).toBe(2))
    })

    it("does not serve user A's activity heatmap to user B in the same tab", async () => {
        getMyActivityDays.mockResolvedValue({ weeks: 12, days: [{ date: "2026-08-15", xp: 90 }] })
        const { result } = renderHook(() => useGetMyActivityDaysSwr(12), { wrapper })

        signIn("user-a")
        await waitFor(() => expect(result.current.data?.days[0]?.xp).toBe(90))

        signOut()

        getMyActivityDays.mockImplementation(() => new Promise(() => undefined))
        signIn("user-b")

        expect(result.current.data).toBeUndefined()
    })

    it("fires no request for a signed-in viewer whose identity has not hydrated yet", async () => {
        getMyStreak.mockResolvedValue(streakOf(5))
        renderHook(() => useGetMyStreakSwr(), { wrapper })

        // `authenticated` flips before the `me` query resolves — a request we cannot
        // attribute to an identity has nowhere safe to cache its answer.
        await act(async () => {
            store.dispatch(setAuthenticated(true))
        })

        expect(getMyStreak).not.toHaveBeenCalled()
    })
})

describe("gamification hooks — call sites can still mutate the key", () => {
    it("revalidates the hook when mutated with the EXPORTED builder (what the streak popover uses)", async () => {
        getMyStreak.mockResolvedValue(streakOf(30))
        const { result } = renderHook(
            () => ({ streak: useGetMyStreakSwr(), swr: useSWRConfig() }),
            { wrapper },
        )

        signIn("user-a")
        await waitFor(() => expect(result.current.streak.data?.currentStreak).toBe(30))

        // A freeze was consumed — the backend value changed and the popover mutates.
        getMyStreak.mockResolvedValue(streakOf(31))
        await act(async () => {
            await result.current.swr.mutate(myStreakSwrKey("user-a"))
        })

        await waitFor(() => expect(result.current.streak.data?.currentStreak).toBe(31))
    })

    it("revalidates the heatmap when mutated with the builder + the popover's window", async () => {
        getMyActivityDays.mockResolvedValue({ weeks: 12, days: [{ date: "2026-08-15", xp: 10 }] })
        const { result } = renderHook(
            () => ({ activity: useGetMyActivityDaysSwr(12), swr: useSWRConfig() }),
            { wrapper },
        )

        signIn("user-a")
        await waitFor(() => expect(result.current.activity.data?.days[0]?.xp).toBe(10))

        getMyActivityDays.mockResolvedValue({ weeks: 12, days: [{ date: "2026-08-15", xp: 70 }] })
        await act(async () => {
            await result.current.swr.mutate(myActivityDaysSwrKey("user-a", 12))
        })

        await waitFor(() => expect(result.current.activity.data?.days[0]?.xp).toBe(70))
    })

    it("does NOT revalidate when mutated with the old hand-written key (the silent break)", async () => {
        getMyStreak.mockResolvedValue(streakOf(30))
        const { result } = renderHook(
            () => ({ streak: useGetMyStreakSwr(), swr: useSWRConfig() }),
            { wrapper },
        )

        signIn("user-a")
        await waitFor(() => expect(result.current.streak.data?.currentStreak).toBe(30))
        const fetchesBefore = getMyStreak.mock.calls.length

        // The pre-patch call site rebuilt the key by hand, without the viewer id.
        getMyStreak.mockResolvedValue(streakOf(31))
        await act(async () => {
            await result.current.swr.mutate(["GET_MY_STREAK_SWR"])
        })

        // Nothing refetched, nothing repainted — a mutate that matches no key fails
        // silently, which is why the call site must import the builder.
        expect(getMyStreak.mock.calls.length).toBe(fetchesBefore)
        expect(result.current.streak.data?.currentStreak).toBe(30)
    })
})
