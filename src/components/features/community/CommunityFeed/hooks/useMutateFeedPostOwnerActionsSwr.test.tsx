import { renderHook } from "@testing-library/react"
import { unstable_serialize } from "swr/infinite"
import type { Cache, ScopedMutator } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    COMMUNITY_FEED_TAG,
    type CommunityFeedPage,
    type CommunityPost,
} from "../../hooks/useQueryCommunityFeedSwr"

/**
 * Unit — the FEED-side owner writes.
 *
 * The REST call, the auth guard and the toasts belong to the shared
 * `useMutatePostOwnerActionsSwr` (mocked here); what this hook owns is the row's
 * OPTIMISTIC removal, so that is what the tests pin:
 *  - the row leaves every mounted feed cache BEFORE the DELETE resolves,
 *  - a failed / guest-blocked write puts it back,
 *  - the rollback re-inserts into the CURRENT pages read at revert time, so a
 *    change that landed while the DELETE was in flight is NOT clobbered by a
 *    stale snapshot,
 *  - a successful delete leaves the row gone AND does not navigate (the shared
 *    hook's `router.replace("/community")` would throw the viewer off the tab
 *    they deleted from — /community/following, /community/campus),
 *  - a successful edit mirrors the new title/body onto the row (the shared hook
 *    only patches the detail/meta caches, which a feed row never reads).
 */

/** The real infinite key `useSWRInfinite` stores page 1 of a feed scope under. */
const feedInfiniteKey = (tab: string, campus = "", cursor = ""): string =>
    unstable_serialize(() => [COMMUNITY_FEED_TAG, tab, campus, cursor])

const post = (id: string): CommunityPost => ({
    id,
    author: "A",
    authorUsername: "a",
    timeLabel: "now",
    title: `title-${id}`,
    snippet: `snippet-${id}`,
    likes: 0,
    liked: false,
    comments: 0,
    media: [],
})

const page = (posts: Array<CommunityPost>): CommunityFeedPage => ({
    items: posts,
    nextCursor: null,
})

/** SWR cache + mutator stand-in (same shape the feed-plumbing test uses). */
const makeCache = (entries: Record<string, Array<CommunityFeedPage>>) => {
    const store = new Map<string, { data: Array<CommunityFeedPage> }>(
        Object.entries(entries).map(([key, value]) => [key, { data: value }]),
    )
    const cache = {
        keys: () => store.keys(),
        get: (key: string) => store.get(key),
        set: (key: string, value: { data: Array<CommunityFeedPage> }) => store.set(key, value),
    } as unknown as Cache
    const mutate = ((key: string, data: unknown) => {
        const current = store.get(key)?.data
        const next = typeof data === "function" ? (data as (d: unknown) => unknown)(current) : data
        store.set(key, { data: next as Array<CommunityFeedPage> })
        return Promise.resolve(next)
    }) as unknown as ScopedMutator
    return { store, cache, mutate }
}

let swrConfig: { cache: Cache; mutate: ScopedMutator }
vi.mock("swr", () => ({
    useSWRConfig: () => swrConfig,
}))

const removePost = vi.fn()
const editPost = vi.fn()
vi.mock("../../CommunityPostDetail/hooks/useMutatePostOwnerActionsSwr", () => ({
    useMutatePostOwnerActionsSwr: () => ({ removePost, editPost }),
}))

import { useMutateFeedPostOwnerActionsSwr } from "./useMutateFeedPostOwnerActionsSwr"

const ids = (pages: Array<CommunityFeedPage> | undefined): Array<string> =>
    (pages ?? []).flatMap((current) => current.items.map((item) => item.id))

beforeEach(() => {
    removePost.mockReset()
    editPost.mockReset()
})

describe("useMutateFeedPostOwnerActionsSwr — deleteFeedPost", () => {
    it("drops the row from every mounted feed scope BEFORE the write resolves", async () => {
        const forYou = feedInfiniteKey("forYou")
        const following = feedInfiniteKey("following")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1"), post("p2")])],
            [following]: [page([post("p1")])],
        })
        swrConfig = { cache, mutate }
        // the DELETE never settles → the optimistic window stays open for the assert
        removePost.mockReturnValue(new Promise(() => undefined))

        const { result } = renderHook(() => useMutateFeedPostOwnerActionsSwr())
        void result.current.deleteFeedPost("p1")
        // let the optimistic mutate microtasks flush
        await Promise.resolve()

        expect(ids(store.get(forYou)?.data)).toEqual(["p2"])
        expect(ids(store.get(following)?.data)).toEqual([])
    })

    it("keeps the row gone when the delete succeeds, without leaving the tab", async () => {
        const forYou = feedInfiniteKey("forYou")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1"), post("p2")])],
        })
        swrConfig = { cache, mutate }
        removePost.mockResolvedValue(true)

        const { result } = renderHook(() => useMutateFeedPostOwnerActionsSwr())
        await result.current.deleteFeedPost("p1")

        // `navigate: false` → the shared hook keeps its router.replace to itself
        expect(removePost).toHaveBeenCalledWith("p1", { navigate: false })
        expect(ids(store.get(forYou)?.data)).toEqual(["p2"])
    })

    it("rolls the row back at its position when the delete fails", async () => {
        const forYou = feedInfiniteKey("forYou")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1"), post("p2"), post("p3")])],
        })
        swrConfig = { cache, mutate }
        // the shared hook already toasted the reason; it just reports failure
        removePost.mockResolvedValue(false)

        const { result } = renderHook(() => useMutateFeedPostOwnerActionsSwr())
        const ok = await result.current.deleteFeedPost("p2")

        expect(ok).toBe(false)
        expect(ids(store.get(forYou)?.data)).toEqual(["p1", "p2", "p3"])
    })

    it("rolls back onto the FRESH pages — a change made mid-flight survives", async () => {
        const forYou = feedInfiniteKey("forYou")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1"), post("p2")])],
        })
        swrConfig = { cache, mutate }
        removePost.mockImplementation(async () => {
            // while the DELETE is in flight another writer prepends a new row and
            // likes an existing one — a snapshot restore would wipe both
            await mutate<Array<CommunityFeedPage>>(forYou, (pages) =>
                (pages ?? []).map((current, index) =>
                    index === 0
                        ? {
                            ...current,
                            items: [
                                post("p0"),
                                ...current.items.map((item) =>
                                    item.id === "p2" ? { ...item, likes: 7, liked: true } : item,
                                ),
                            ],
                        }
                        : current,
                ),
            )
            return false
        })

        const { result } = renderHook(() => useMutateFeedPostOwnerActionsSwr())
        await result.current.deleteFeedPost("p1")

        const items = store.get(forYou)?.data[0].items ?? []
        // the deleted row is back …
        expect(items.map((item) => item.id)).toContain("p1")
        // … and neither the row added mid-flight nor the like landed on p2 was lost
        expect(items.map((item) => item.id)).toContain("p0")
        expect(items.find((item) => item.id === "p2")?.likes).toBe(7)
    })

    it("does not duplicate the row if a refetch already brought it back", async () => {
        const forYou = feedInfiniteKey("forYou")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1")])],
        })
        swrConfig = { cache, mutate }
        removePost.mockImplementation(async () => {
            await mutate<Array<CommunityFeedPage>>(forYou, [page([post("p1")])])
            return false
        })

        const { result } = renderHook(() => useMutateFeedPostOwnerActionsSwr())
        await result.current.deleteFeedPost("p1")

        expect(ids(store.get(forYou)?.data)).toEqual(["p1"])
    })
})

describe("useMutateFeedPostOwnerActionsSwr — editFeedPost", () => {
    it("mirrors the saved title/body onto the row once the server accepted it", async () => {
        const forYou = feedInfiniteKey("forYou")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1"), post("p2")])],
        })
        swrConfig = { cache, mutate }
        editPost.mockResolvedValue(true)

        const { result } = renderHook(() => useMutateFeedPostOwnerActionsSwr())
        const ok = await result.current.editFeedPost("p1", { title: "Mới", content: "Nội dung mới" })

        expect(ok).toBe(true)
        expect(editPost).toHaveBeenCalledWith("p1", { title: "Mới", content: "Nội dung mới" })
        const items = store.get(forYou)?.data[0].items ?? []
        expect(items[0].title).toBe("Mới")
        expect(items[0].snippet).toBe("Nội dung mới")
        // the untouched row keeps its own text
        expect(items[1].title).toBe("title-p2")
    })

    it("leaves the row alone when the edit was rejected", async () => {
        const forYou = feedInfiniteKey("forYou")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1")])],
        })
        swrConfig = { cache, mutate }
        editPost.mockResolvedValue(false)

        const { result } = renderHook(() => useMutateFeedPostOwnerActionsSwr())
        const ok = await result.current.editFeedPost("p1", { content: "x" })

        expect(ok).toBe(false)
        expect(store.get(forYou)?.data[0].items[0].title).toBe("title-p1")
        expect(store.get(forYou)?.data[0].items[0].snippet).toBe("snippet-p1")
    })
})
