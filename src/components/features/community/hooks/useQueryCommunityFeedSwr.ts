"use client"

import useSWRInfinite from "swr/infinite"
import { unstable_serialize } from "swr/infinite"
import type { Cache, ScopedMutator } from "swr"
import { useLocale } from "next-intl"
import {
    FeedTab,
    queryCommunityFeed,
    type FeedAuthorAchievement,
    type FeedPost,
    type FeedQuotedPost,
} from "@/modules/api/graphql/queries/query-community-feed"
import type { QuotedPost } from "@/components/reuseable/QuotedPostCard"
import { CommunitySearchSort } from "@/modules/api/graphql/queries/query-community-search"
import type { PostMediaItem } from "@/components/blocks/feed/PostMediaGrid"
import { splitBodyImages, unwrapAutolinks } from "@/components/features/community/CommunityPostDetail/postLinks"
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

/**
 * Turn body-embedded image urls ({@link splitBodyImages}) into media-grid items.
 *
 * These images have no server-side `PostMedia` row — they were typed into the body by the
 * editor toolbar — so the url IS the identity: the grid keys its tiles by `id` and the
 * lightbox loads `storageKey`, and both are the same already-signed delivery url.
 */
export const toBodyImageItems = (urls: Array<string>): Array<PostMediaItem> =>
    urls.map((url) => ({ id: url, mediaType: "IMAGE", storageKey: url }))

/**
 * Map BE `Post.quotedPost` onto the render contract of {@link QuotedPost}. `null`/absent stays
 * `null` (bài thường, không vẽ card lồng).
 *
 * `available` được CHUYỂN NGUYÊN, không quy về boolean "thật": card phân biệt `false` (bài gốc
 * không còn khả dụng → in nhãn) với absent (composer tự dựng vật thể → coi như khả dụng).
 *
 * `snippet` chạy qua ĐÚNG cặp {@link unwrapAutolinks} + {@link splitBodyImages} như
 * {@link toCommunityPost}: card lồng cũng in TEXT THUẦN, nên thiếu bước tách ảnh thì cùng một bài
 * sẽ hiện chữ sạch ở hàng gốc mà lộ nguyên `![Ảnh](https://…)` ở card lồng ngay bên dưới. Các url
 * ảnh bị BỎ (card lồng chỉ có một dòng chữ, không có lưới ảnh để vẽ chúng).
 */
export const toQuotedPost = (quoted: FeedQuotedPost | null | undefined): QuotedPost | null => {
    if (!quoted) {
        return null
    }
    return {
        author: quoted.author?.displayName ?? quoted.author?.username ?? "",
        authorUsername: quoted.author?.username ?? "",
        title: quoted.title ?? "",
        snippet: splitBodyImages(unwrapAutolinks(quoted.snippet ?? "")).text,
        available: quoted.available,
    }
}

/** A community post (BE `Post` mapped to the feed card contract). */
export interface CommunityPost {
    id: string
    /**
     * Author display name, or `""` when the BE row carried no profile card. NEVER the
     * author id — the card renders a shared "member" label for the empty case instead
     * of leaking a uuid as a name.
     */
    author: string
    /** URL-facing username for the profile link + hovercard. */
    authorUsername: string
    /**
     * Author's uploaded avatar (BE `PublicUser.avatarUrl`, already selected by the feed
     * document). Optional: `null`/absent simply means "no photo" and the shared avatar
     * falls back to the initials tile.
     */
    authorAvatar?: string | null
    /**
     * Author's platform staff role (BE `PublicUser.staffRole`), driving the verified seal
     * next to the name. `null`/absent = ordinary member = NO badge.
     */
    authorStaffRole?: string | null
    /** Mã khung viền tác giả đang đeo (BE `PublicUser.avatarFrame`); null = không khung. */
    authorFrame?: string | null
    /**
     * THÀNH TÍCH tác giả ghim sau tên (BE `PublicUser.equippedAchievement`); null/absent =
     * không ghim ⇒ hàng tên không vẽ thêm gì. Giữ nguyên VẬT THỂ (mã + tên + art) chứ không
     * dẹt xuống mã như {@link authorFrame}: con dấu cần art và tên để vẽ, và BE đã gửi sẵn
     * cả hai — dẹt đi sẽ buộc mỗi hàng feed đi tra lại danh mục badge.
     */
    authorAchievement?: FeedAuthorAchievement | null
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
    /**
     * Bài GỐC lồng bên dưới khi đây là bài ĐĂNG LẠI (BE `Post.quotedPost`); `null`/absent =
     * bài thường ⇒ không vẽ card lồng.
     */
    quotedPost?: QuotedPost | null
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

/**
 * Enumerate the community-feed PAGE caches — the serialized
 * `["community-feed", tab, sort, campus, cursor]` array keys that `useSWRInfinite`
 * stores each page under. They carry the tag exactly like the aggregates do, so the
 * `$inf$` prefix is what tells the two apart (mirror of {@link communityFeedCacheKeys}).
 */
export const communityFeedPageCacheKeys = (cache: Cache): Array<string> => {
    const keys: Array<string> = []
    for (const key of cache.keys()) {
        if (
            typeof key === "string" &&
            !key.startsWith(INFINITE_PREFIX) &&
            key.includes(COMMUNITY_FEED_TAG)
        ) {
            keys.push(key)
        }
    }
    return keys
}

/**
 * Force every community feed to refetch from the BE — called after a post is created
 * so the new row shows up on back-navigation instead of only after a hard reload.
 *
 * The PAGE caches are dropped FIRST, and that is the whole point. `mutate(<$inf$ key>)`
 * on its own is a SILENT NO-OP here: the infinite fetcher only refetches a page when
 * `revalidateAll`, the hook's own force flag (`_i`, set exclusively by the mutate that
 * `useSWRInfinite` RETURNS), `revalidateFirstPage`, or a missing page cache says so —
 * and this feed runs with `revalidateFirstPage: false`, while a GLOBAL mutate never sets
 * `_i`. So every page came back straight from cache and not a single request left the
 * browser. Emptying the page caches leaves "the cache is missing" as the trigger, which
 * a global caller CAN reach.
 *
 * Clearing also fixes the case where no feed is mounted (the `/community/new` page):
 * global mutate can't revalidate a key nobody subscribes to, but the emptied pages make
 * the feed refetch when it mounts again.
 */
export const revalidateCommunityFeeds = async (
    cache: Cache,
    mutate: ScopedMutator,
): Promise<Array<unknown>> => {
    await Promise.all(
        communityFeedPageCacheKeys(cache).map((key) =>
            mutate(key, undefined, { revalidate: false }),
        ),
    )
    return Promise.all(communityFeedCacheKeys(cache).map((key) => mutate(key)))
}

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
 *
 * `author` is a batched `PublicUser` that the gateway leaves NULL when the profile card
 * is missing (hence `authorId` existing as its own field), so every read off it is
 * optional-chained — the row must degrade, not throw. `avatarUrl` is carried through as
 * `authorAvatar`: it was already selected by the document but dropped here, which is why
 * every feed face fell back to a generated one.
 *
 * `snippet` chạy qua {@link unwrapAutolinks}: dòng feed in snippet dưới dạng TEXT THUẦN
 * (cả hàng đã nằm trong một `<Link>` phủ toàn bộ, chèn `<a>` vào đây là lồng anchor), nên
 * autolink CommonMark `<https://…>` của tác giả sẽ lộ nguyên cặp `<>` ra màn hình. Bỏ cặp
 * dấu đó là đủ để đọc ra như một URL bình thường mà không đụng gì tới cấu trúc link của hàng.
 *
 * Cùng lý do đó, snippet còn chạy qua {@link splitBodyImages}: ảnh chèn bằng thanh công cụ
 * của editor nằm TRONG THÂN BÀI (`![Ảnh](https://…)`) chứ không thành attachment, nên trước
 * đây hàng feed in ra đúng cú pháp thô ấy mà chẳng có tấm ảnh nào. Tách xong thì phần chữ
 * sạch cú pháp, còn các url ảnh nối vào `media` để `PostMediaGrid` vẽ thumbnail (attachment
 * thật đứng trước, ảnh trong thân bài nối sau, giữ nguyên thứ tự tác giả gõ).
 */
export const toCommunityPost = (post: FeedPost, locale: string): CommunityPost => {
    const { text, images } = splitBodyImages(unwrapAutolinks(post.snippet ?? ""))
    return {
        id: post.id,
        author: post.author?.displayName ?? post.author?.username ?? "",
        // Chỉ nhận username THẬT: rơi về id là dựng link hồ sơ /u/<uuid> → 404. Rỗng thì
        // UserLink hiện tên không kèm link, thà vậy còn hơn liên kết chết. (Quyền sở hữu bài
        // chốt bằng `authorId` ngay dưới, không phụ thuộc trường này.)
        authorUsername: post.author?.username ?? "",
        authorAvatar: post.author?.avatarUrl ?? null,
        authorStaffRole: post.author?.staffRole ?? null,
        authorFrame: post.author?.avatarFrame ?? null,
        authorAchievement: post.author?.equippedAchievement ?? null,
        authorId: post.authorId ?? post.author?.id ?? null,
        pinned: post.pinned ?? false,
        timeLabel: formatRelativeTime(post.createdAt, locale),
        title: post.title ?? "",
        snippet: text,
        likes: post.likeCount,
        liked: post.likedByMe,
        comments: post.commentCount,
        media: [...toMediaItems(post.media), ...toBodyImageItems(images)],
        quotedPost: toQuotedPost(post.quotedPost),
    }
}

/** Items per feed page (BE `CursorInput.limit`). */
const PAGE_LIMIT = 20

/** Infinite-scroll page key: `["community-feed", tab, sort, campus, cursor]` (null ⇒ end). */
export type FeedPageKey = readonly [string, CommunityFeedTab, CommunitySearchSort, string, string]

/**
 * `useSWRInfinite` key factory for one feed scope — pure, so the paging STOP condition is
 * unit-testable without rendering. Page 1 has no cursor; every later page keys off the
 * PREVIOUS page's `nextCursor`, and returning `null` tells SWR the list is exhausted (the
 * BE returns `nextCursor: null` on the last page, so no extra empty request is made).
 *
 * `sort` is part of the key so flipping Newest↔Oldest refetches from page 1 (the tab feed now
 * honours the sort server-side — change community-feed-sort).
 */
export const communityFeedPageKey = (
    tab: CommunityFeedTab,
    sort: CommunitySearchSort,
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
    return [COMMUNITY_FEED_TAG, tab, sort, campus, cursor]
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
 * `sort` (Newest/Oldest) orders the tab feed by `created_at` server-side (change
 * community-feed-sort); it is part of the SWR key so switching sort refetches from page 1. The
 * TRENDING tab ignores it server-side (always engagement order) — the UI hides the control there.
 *
 * Returns the flattened post list plus `hasMore` / `isLoadingMore` / `size` / `setSize`
 * for the {@link import("@/components/blocks/async/InfiniteScrollSentinel").InfiniteScrollSentinel}.
 */
export const useQueryCommunityFeedSwr = (
    tab: CommunityFeedTab = "forYou",
    sort: CommunitySearchSort = CommunitySearchSort.Newest,
    campus?: string,
) => {
    const locale = useLocale()
    const scopedCampus = tab === "campus" ? campus : undefined

    const getKey = (index: number, previous: CommunityFeedPage | null): FeedPageKey | null =>
        communityFeedPageKey(tab, sort, scopedCampus ?? "", index, previous)

    const fetchPage = async ([, , , , cursor]: FeedPageKey): Promise<CommunityFeedPage> => {
        const result = await queryCommunityFeed({
            tab: toFeedTab(tab),
            page: { limit: PAGE_LIMIT, cursor: cursor || undefined },
            campus: scopedCampus,
            sort,
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
