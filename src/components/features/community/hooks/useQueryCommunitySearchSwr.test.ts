import { describe, expect, it } from "vitest"
import {
    COMMUNITY_FEED_TAG,
    communityFeedPageKey,
    type CommunityFeedPage,
} from "./useQueryCommunityFeedSwr"
import {
    COMMUNITY_SEARCH_TAG,
    CommunitySearchSort,
    communitySearchPageKey,
    isSearchActive,
    type CommunitySearchCriteria,
} from "./useQueryCommunitySearchSwr"

/**
 * Unit — the `useSWRInfinite` key factories behind the community feed tabs and the
 * search results.
 *
 * Both lists page by CURSOR (`PostConnection.nextCursor`), and the whole paging
 * contract lives in `getKey`: page 1 has no cursor, page N+1 keys off page N's
 * `nextCursor`, and `null` is the STOP signal. A regression there is invisible in
 * types — it either fires one useless request past the end of the list, or (worse)
 * keys every page identically and loops forever — so it is pinned here.
 */

const page = (nextCursor: string | null): CommunityFeedPage => ({ items: [], nextCursor })

const criteria = (overrides: Partial<CommunitySearchCriteria> = {}): CommunitySearchCriteria => ({
    q: "kafka",
    sort: CommunitySearchSort.Newest,
    ...overrides,
})

describe("communityFeedPageKey", () => {
    it("keys page 1 with an empty cursor and page 2 with the previous nextCursor", () => {
        expect(communityFeedPageKey("forYou", "", 0, null)).toEqual([
            COMMUNITY_FEED_TAG,
            "forYou",
            "",
            "",
        ])
        expect(communityFeedPageKey("forYou", "", 1, page("c1"))).toEqual([
            COMMUNITY_FEED_TAG,
            "forYou",
            "",
            "c1",
        ])
    })

    it("STOPS (null) once a page comes back without a next cursor", () => {
        expect(communityFeedPageKey("forYou", "", 1, page(null))).toBeNull()
        // an empty-string cursor is just as exhausted as null
        expect(communityFeedPageKey("forYou", "", 1, page(""))).toBeNull()
    })

    it("scopes the key by tab + campus so switching scope refetches", () => {
        expect(communityFeedPageKey("campus", "hcm", 0, null)).toEqual([
            COMMUNITY_FEED_TAG,
            "campus",
            "hcm",
            "",
        ])
        expect(communityFeedPageKey("campus", "hcm", 0, null)).not.toEqual(
            communityFeedPageKey("campus", "dn", 0, null),
        )
    })
})

describe("isSearchActive", () => {
    it("is false for a blank keyword and no filters, true for any set dimension", () => {
        expect(isSearchActive(criteria({ q: "   " }))).toBe(false)
        expect(isSearchActive(criteria({ q: "" }))).toBe(false)
        expect(isSearchActive(criteria({ q: "", postType: "QUESTION" }))).toBe(true)
        expect(isSearchActive(criteria({ q: "", authorId: "u1" }))).toBe(true)
        expect(isSearchActive(criteria({ q: "", groupId: "g1" }))).toBe(true)
        expect(isSearchActive(criteria({ q: " kafka " }))).toBe(true)
    })
})

describe("communitySearchPageKey", () => {
    it("does not fetch (null) while the search bar is idle", () => {
        expect(communitySearchPageKey(criteria({ q: "  " }), 0, null)).toBeNull()
    })

    it("keys page 1 with a trimmed keyword and an empty cursor", () => {
        expect(communitySearchPageKey(criteria({ q: " kafka " }), 0, null)).toEqual([
            COMMUNITY_SEARCH_TAG,
            "kafka",
            CommunitySearchSort.Newest,
            "",
            "",
            "",
            "",
        ])
    })

    it("keys page 2 with the previous page's nextCursor (search cursor = page number)", () => {
        expect(communitySearchPageKey(criteria(), 1, page("1"))).toEqual([
            COMMUNITY_SEARCH_TAG,
            "kafka",
            CommunitySearchSort.Newest,
            "",
            "",
            "",
            "1",
        ])
    })

    it("STOPS (null) once a page comes back without a next cursor", () => {
        expect(communitySearchPageKey(criteria(), 1, page(null))).toBeNull()
        expect(communitySearchPageKey(criteria(), 3, page(""))).toBeNull()
    })

    it("re-keys when any filter dimension changes", () => {
        const base = communitySearchPageKey(criteria(), 0, null)
        expect(communitySearchPageKey(criteria({ sort: CommunitySearchSort.Oldest }), 0, null))
            .not.toEqual(base)
        expect(communitySearchPageKey(criteria({ postType: "QUESTION" }), 0, null)).not.toEqual(base)
        expect(communitySearchPageKey(criteria({ groupId: "g1" }), 0, null)).not.toEqual(base)
    })

    it("tags search pages under the feed tag prefix so optimistic patches reach them", () => {
        // `communityFeedCacheKeys` isolates feed caches by substring on COMMUNITY_FEED_TAG;
        // search pages must stay inside that family or a like fired from a search result
        // would silently not patch its row.
        expect(COMMUNITY_SEARCH_TAG.startsWith(COMMUNITY_FEED_TAG)).toBe(true)
        expect(COMMUNITY_SEARCH_TAG).not.toBe(COMMUNITY_FEED_TAG)
    })
})
