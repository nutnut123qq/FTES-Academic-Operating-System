"use client"

import useSWRInfinite from "swr/infinite"
import { unstable_serialize } from "swr/infinite"
import type { Cache, ScopedMutator } from "swr"
import { useLocale } from "next-intl"
import {
    FeedTab,
    queryCommunityFeed,
    type FeedPost,
} from "@/modules/api/graphql/queries/query-community-feed"
import type { PostMediaItem } from "@/components/blocks/feed/PostMediaGrid"
import { formatRelativeTime } from "./relativeTime"

/** Map BE `Post.media` onto the render contract of the shared media grid. */
export const toMediaItems = (
    media: Array<{ id: string; mediaType: string; storageKey: string }> | undefined,
): Array<PostMediaItem> =>
    (media ?? []).map((item) => ({
        id: item.id,
        mediaType: item.mediaType,
        storageKey: item.storageKey,
    }))

/** A community post (BE `Post` mapped to the feed card contract). */
export interface CommunityPost {
    id: string
    author: string
    /** URL-facing username for the profile link + hovercard. */
    authorUsername: string
    /**
     * Author id (BE `Post.authorId`) — the owner gate compares this, since a display
     * name/username can be missing while the id is always present.
     */
    authorId: string | null
    /**
     * Pinned by an admin (BE `Post.pinned`). Render the badge only: the BE already
     * hoists pinned posts to the head of the first page, so never re-sort on it.
     */
    pinned: boolean
    timeLabel: string
    title: string
    snippet: string
    likes: number
    /** Whether the current user has liked this post (drives optimistic toggle). */
    liked: boolean
    comments: number
    /** Image attachments in server order (BE `Post.media`); empty when the post has none. */
    media: Array<PostMediaItem>
}

/** One cursor page of the feed (BE `PostConnection` mapped to card contract). */
export interface CommunityFeedPage {
    items: Array<CommunityPost>
    nextCursor: string | null
}

/** Feed scope selectable by the shell tabs. */
export type CommunityFeedTab = "forYou" | "following" | "campus" | "trending"

/**
 * SWR cache tag for the community feed. The feed is cursor-paginated via
 * `useSWRInfinite`, whose assembled pages live under an `$inf$…` string key that
 * embeds the serialized first-page key `["community-feed", tab, campus, cursor]`.
 * The optimistic like/comment mutations target those aggregate caches through
 * {@link mutateCommunityFeeds} rather than a single exact key.
 *
 * The community SEARCH hook deliberately tags its own infinite pages with a tag that
 * STARTS WITH this one (`community-feed-search`, see `useQueryCommunitySearchSwr`), so a
 * like/comment fired from a search result lands on the search cache too — search rows carry
 * the exact same {@link CommunityFeedPage} shape, so {@link patchFeedPostInPages} applies
 * verbatim.
 */
export const COMMUNITY_FEED_TAG = "community-feed"

/** The `useSWRInfinite` cache-key prefix (`$inf$`), derived from the public helper. */
const INFINITE_PREFIX = unstable_serialize(() => null)

/**
 * Enumerate the mounted community-feed infinite cache keys — one `$inf$…` string
 * key per scope (For You / following / campus / trending and any campus-scoped
 * variant). Each such key embeds the serialized first-page key, which always
 * begins with {@link COMMUNITY_FEED_TAG}, so a substring test isolates the feed
 * caches from every other `$inf$` aggregate in the cache.
 *
 * NOTE: this must address the `$inf$` keys DIRECTLY. SWR 2.x global
 * `mutate(filterFn)` deliberately SKIPS every `$inf$`/`$sub$` aggregate key before
 * the filter runs (and hands the filter the per-page ARRAY key, never the string),
 * so a key-filter can never reach the infinite feed caches — hence the manual scan.
 */
export const communityFeedCacheKeys = (cache: Cache): Array<string> => {
    const keys: Array<string> = []
    for (const key of cache.keys()) {
        if (
            typeof key === "string" &&
            key.startsWith(INFINITE_PREFIX) &&
            key.includes(COMMUNITY_FEED_TAG)
        ) {
            keys.push(key)
        }
    }
    return keys
}

/**
 * Apply `updater` to EVERY mounted community-feed infinite cache (all scopes) with
 * no revalidation — the value under each key is the assembled
 * `Array<CommunityFeedPage>`, so patch it with {@link patchFeedPostInPages}. Used
 * by the optimistic like/comment mutations so a change lands on whichever tab is
 * mounted. Addressing each exact `$inf$` string key works where a key-filter
 * cannot (see {@link communityFeedCacheKeys}).
 */
export const mutateCommunityFeeds = (
    cache: Cache,
    mutate: ScopedMutator,
    updater: (
        pages: Array<CommunityFeedPage> | undefined,
    ) => Array<CommunityFeedPage> | undefined,
): Promise<Array<unknown>> =>
    Promise.all(
        communityFeedCacheKeys(cache).map((key) =>
            mutate<Array<CommunityFeedPage>>(key, updater, { revalidate: false }),
        ),
    )

/** Revalidate (refetch) every mounted community-feed infinite cache. */
export const revalidateCommunityFeeds = (
    cache: Cache,
    mutate: ScopedMutator,
): Promise<Array<unknown>> =>
    Promise.all(communityFeedCacheKeys(cache).map((key) => mutate(key)))

/** Apply `patch` to the target post across every loaded feed page (identity elsewhere). */
export const patchFeedPostInPages = (
    pages: Array<CommunityFeedPage> | undefined,
    postId: string,
    patch: (post: CommunityPost) => CommunityPost,
): Array<CommunityFeedPage> | undefined =>
    pages?.map((page) => ({
        ...page,
        items: page.items.map((post) => (post.id === postId ? patch(post) : post)),
    }))

/** Map the shell tab to the BE `FeedTab` enum literal (inlined into the query, not a variable). */
const toFeedTab = (tab: CommunityFeedTab): FeedTab => {
    switch (tab) {
    case "following":
        return FeedTab.Following
    case "campus":
        return FeedTab.Campus
    case "trending":
        return FeedTab.Trending
    case "forYou":
    default:
        return FeedTab.ForYou
    }
}

/**
 * Map a BE `Post` to the feed card contract. The gateway now enriches every feed row
 * with `snippet`, `likeCount`, `likedByMe` and `commentCount`, so the card renders the
 * real excerpt and engagement instead of the previous "" / 0 / false placeholders.
 */
export const toCommunityPost = (post: FeedPost, locale: string): CommunityPost => ({
    id: post.id,
    author: post.author.displayName ?? post.author.username ?? "",
    authorUsername: post.author.username ?? post.author.id,
    authorId: post.authorId ?? post.author.id ?? null,
    pinned: post.pinned ?? false,
    timeLabel: formatRelativeTime(post.createdAt, locale),
    title: post.title ?? "",
    snippet: post.snippet ?? "",
    likes: post.likeCount,
    liked: post.likedByMe,
    comments: post.commentCount,
    media: toMediaItems(post.media),
})

/** Items per feed page (BE `CursorInput.limit`). */
const PAGE_LIMIT = 20

/** Infinite-scroll page key: `["community-feed", tab, campus, cursor]` (null ⇒ end). */
export type FeedPageKey = readonly [string, CommunityFeedTab, string, string]

/**
 * `useSWRInfinite` key factory for one feed scope — pure, so the paging STOP condition is
 * unit-testable without rendering. Page 1 has no cursor; every later page keys off the
 * PREVIOUS page's `nextCursor`, and returning `null` tells SWR the list is exhausted (the
 * BE returns `nextCursor: null` on the last page, so no extra empty request is made).
 */
export const communityFeedPageKey = (
    tab: CommunityFeedTab,
    campus: string,
    index: number,
    previous: CommunityFeedPage | null,
): FeedPageKey | null => {
    // previous page had no next cursor → end of list, stop paging
    if (previous && !previous.nextCursor) {
        return null
    }
    // page 1 has no cursor; later pages use the previous page's nextCursor
    const cursor = index === 0 ? "" : previous?.nextCursor ?? ""
    return [COMMUNITY_FEED_TAG, tab, campus, cursor]
}

/**
 * Loads the community feed for a scope from the real BE GraphQL `feed(tab, page, campus)`,
 * cursor-paginated with `useSWRInfinite` (page N+1 keys off page N's `nextCursor`). Requires
 * auth (viewer-scoped visibility); a guest / error surfaces via `error` and the feed renders
 * its empty/error state. Keyed on the tab (and `campus` when given) so switching scope
 * refetches; every page key starts with `COMMUNITY_FEED_TAG` so the optimistic like/comment
 * mutations keep patching the right aggregate cache via {@link mutateCommunityFeeds}.
 *
 * `campus` scopes the CAMPUS tab; omit it and the BE falls back to the viewer's profile
 * campus (empty connection when the viewer has no campus). Ignored for other tabs.
 *
 * Returns the flattened post list plus `hasMore` / `isLoadingMore` / `size` / `setSize`
 * for the {@link import("@/components/blocks/async/InfiniteScrollSentinel").InfiniteScrollSentinel}.
 */
export const useQueryCommunityFeedSwr = (tab: CommunityFeedTab = "forYou", campus?: string) => {
    const locale = useLocale()
    const scopedCampus = tab === "campus" ? campus : undefined

    const getKey = (index: number, previous: CommunityFeedPage | null): FeedPageKey | null =>
        communityFeedPageKey(tab, scopedCampus ?? "", index, previous)

    const fetchPage = async ([, , , cursor]: FeedPageKey): Promise<CommunityFeedPage> => {
        const result = await queryCommunityFeed({
            tab: toFeedTab(tab),
            page: { limit: PAGE_LIMIT, cursor: cursor || undefined },
            campus: scopedCampus,
        })
        const connection = result.data?.feed
        return {
            items: (connection?.items ?? []).map((item) => toCommunityPost(item, locale)),
            nextCursor: connection?.nextCursor ?? null,
        }
    }

    const { data, isLoading, isValidating, error, size, setSize, mutate } = useSWRInfinite<
        CommunityFeedPage
    >(getKey, fetchPage, { revalidateFirstPage: false })

    const posts: Array<CommunityPost> = (data ?? []).flatMap((page) => page.items)
    const lastPage = data?.[data.length - 1]
    const hasMore = Boolean(lastPage?.nextCursor)
    const isLoadingInitial = isLoading || (isValidating && (data?.length ?? 0) === 0)
    const isLoadingMore = isValidating && (data?.length ?? 0) > 0

    return {
        posts,
        isLoading: isLoadingInitial,
        isLoadingMore,
        error,
        hasMore,
        size,
        setSize,
        mutate,
    }
}
