import { unstable_serialize } from "swr/infinite"
import type { Cache, ScopedMutator } from "swr"
import { describe, expect, it, vi } from "vitest"
import {
    COMMUNITY_FEED_TAG,
    communityFeedCacheKeys,
    mutateCommunityFeeds,
    patchFeedPostInPages,
    type CommunityFeedPage,
    type CommunityPost,
} from "./useQueryCommunityFeedSwr"

/**
 * Unit — the community-feed optimistic-patch plumbing.
 *
 * Regression guard for the #7 fix: SWR 2.x global `mutate(filterFn)` SKIPS every
 * `$inf$` aggregate key before the filter runs, so the previous key-FILTER approach
 * (`isCommunityFeedKey`) matched nothing and the +1 comment / like-flip patches were
 * silent no-ops. These tests seed a cache with the SAME `$inf$…` string keys that
 * `useSWRInfinite` produces (built via the library's own `unstable_serialize`) and
 * assert that (a) `communityFeedCacheKeys` isolates exactly the feed caches and
 * (b) `mutateCommunityFeeds` actually lands the patch on the assembled pages.
 */

/** The real infinite key useSWRInfinite stores page 1 of a feed scope under. */
const feedInfiniteKey = (tab: string, campus = "", cursor = ""): string =>
    unstable_serialize(() => [COMMUNITY_FEED_TAG, tab, campus, cursor])

const post = (id: string, comments: number, likes = 0, liked = false): CommunityPost => ({
    id,
    author: "A",
    authorId: "a-id",
    pinned: false,
    authorUsername: "a",
    timeLabel: "now",
    title: "t",
    snippet: "s",
    likes,
    liked,
    comments,
    media: [],
})

const page = (posts: Array<CommunityPost>): CommunityFeedPage => ({
    items: posts,
    nextCursor: null,
})

/** A minimal cache whose values are `{ data }` states, mirroring SWR's shape. */
const makeCache = (entries: Record<string, Array<CommunityFeedPage>>) => {
    const store = new Map<string, { data: Array<CommunityFeedPage> }>(
        Object.entries(entries).map(([k, v]) => [k, { data: v }]),
    )
    const cache = {
        keys: () => store.keys(),
        get: (k: string) => store.get(k),
        set: (k: string, v: { data: Array<CommunityFeedPage> }) => store.set(k, v),
    } as unknown as Cache
    // A faithful stand-in for SWR's ScopedMutator: when `data` is a function it is
    // called with the current cached data and the result is written back (revalidate
    // is a no-op here — the optimistic patch path always passes `revalidate: false`).
    const mutate = ((key: string, data: unknown) => {
        const current = store.get(key)?.data
        const next = typeof data === "function" ? (data as (d: unknown) => unknown)(current) : data
        store.set(key, { data: next as Array<CommunityFeedPage> })
        return Promise.resolve(next)
    }) as unknown as ScopedMutator
    return { store, cache, mutate }
}

describe("communityFeedCacheKeys", () => {
    it("matches the real $inf$ keys useSWRInfinite emits for every feed scope", () => {
        const forYou = feedInfiniteKey("forYou")
        const following = feedInfiniteKey("following")
        const campus = feedInfiniteKey("campus", "hcm")
        const { cache } = makeCache({
            [forYou]: [],
            [following]: [],
            [campus]: [],
            // unrelated infinite + plain caches must NOT match
            "$inf$@\"followers\",": [],
            "@\"post-detail\",\"p1\",": [],
        })
        const keys = communityFeedCacheKeys(cache)
        expect(new Set(keys)).toEqual(new Set([forYou, following, campus]))
    })

    it("only picks $inf$ keys, never a bare community-feed page key", () => {
        // A per-page (non-aggregate) key also contains the tag but is NOT an $inf$ key.
        const { cache } = makeCache({
            "@\"community-feed\",\"forYou\",\"\",\"\",": [],
            [feedInfiniteKey("forYou")]: [],
        })
        expect(communityFeedCacheKeys(cache)).toEqual([feedInfiniteKey("forYou")])
    })
})

describe("mutateCommunityFeeds", () => {
    it("lands a +1 comment-count patch on the mounted feed scope (the #7 fix)", async () => {
        const forYou = feedInfiniteKey("forYou")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1", 0), post("p2", 5)])],
        })

        await mutateCommunityFeeds(cache, mutate, (pages) =>
            patchFeedPostInPages(pages, "p1", (p) => ({ ...p, comments: p.comments + 1 })),
        )

        const items = store.get(forYou)?.data[0].items
        expect(items?.find((p) => p.id === "p1")?.comments).toBe(1)
        // untouched post is unchanged
        expect(items?.find((p) => p.id === "p2")?.comments).toBe(5)
    })

    it("patches the target post across ALL feed scopes, leaving other feeds' rows intact", async () => {
        const forYou = feedInfiniteKey("forYou")
        const following = feedInfiniteKey("following")
        const { store, cache, mutate } = makeCache({
            [forYou]: [page([post("p1", 0)])],
            [following]: [page([post("p1", 0), post("pX", 0, 2, true)])],
        })

        await mutateCommunityFeeds(cache, mutate, (pages) =>
            patchFeedPostInPages(pages, "p1", (p) => ({ ...p, likes: p.likes + 1, liked: true })),
        )

        expect(store.get(forYou)?.data[0].items[0].likes).toBe(1)
        expect(store.get(following)?.data[0].items[0].liked).toBe(true)
        // the other post in the same feed is untouched
        expect(store.get(following)?.data[0].items[1].id).toBe("pX")
        expect(store.get(following)?.data[0].items[1].likes).toBe(2)
    })

    it("no-ops safely when no feed cache is mounted", async () => {
        const { cache, mutate } = makeCache({})
        const spy = vi.fn()
        await mutateCommunityFeeds(cache, mutate, (pages) => {
            spy()
            return pages
        })
        expect(spy).not.toHaveBeenCalled()
    })
})
