"use client"

import { useLocale } from "next-intl"
import useSWRInfinite from "swr/infinite"
import {
    querySubjectCommunity,
    SubjectFeedScope,
    type SubjectCommunityPost,
} from "@/modules/api/graphql/queries/query-subject-community"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import {
    COMMUNITY_FEED_TAG,
    toBodyImageItems,
    toMediaItems,
    type CommunityFeedPage,
    type CommunityPost,
} from "@/components/features/community/hooks/useQueryCommunityFeedSwr"
import { splitBodyImages, unwrapAutolinks } from "@/components/features/community/CommunityPostDetail/postLinks"
import type { PostMediaItem } from "@/components/blocks/feed/PostMediaGrid"

/** Feed filter scope. */
export type FeedScope = "forYou" | "following" | "trending"

/** Maps the client scope facet to the BE `SubjectFeedScope` enum. */
const toSubjectFeedScope = (scope: FeedScope): SubjectFeedScope => {
    switch (scope) {
        case "following":
            return SubjectFeedScope.Following
        case "trending":
            return SubjectFeedScope.Trending
        case "forYou":
        default:
            return SubjectFeedScope.ForYou
    }
}

/**
 * A subject community post.
 *
 * ponytail: MÃ CHẾT kể từ khi tab Thảo luận chuyển sang dùng thẳng `CommunityFeedRow`
 * (bài trong môn LÀ bài community có `subjectId`, nên card dùng chung `CommunityPost`).
 * Còn sống chỉ vì `useMutateReactSubjectPostSwr` — cũng đã mồ côi — vẫn tham chiếu tới nó.
 * Xoá cả cụm trong một lượt dọn riêng.
 */
export interface SubjectPost {
    id: string
    /** Display name of the author, or `""` when the BE row carried no profile card. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    /** Author's uploaded avatar (BE `PublicUser.avatarUrl`); null/absent = no photo. */
    authorAvatar?: string | null
    /** Author's platform staff role (BE `PublicUser.staffRole`); null/absent = no badge. */
    authorStaffRole?: string | null
    timeLabel: string
    title: string
    snippet: string
    reactions: number
    /** Whether the current user has liked this post (drives optimistic toggle). */
    liked: boolean
    /** Comment count for the discussion engagement bar. */
    comments: number
    /** Image attachments in server order (BE `Post.media`); empty when the post has none. */
    media: Array<PostMediaItem>
}

/**
 * SWR cache key of the OLD flat subject feed.
 *
 * ponytail: mồ côi cùng {@link SubjectPost} — chỉ còn `useMutateReactSubjectPostSwr` (đã chết)
 * dùng. Feed thật giờ nằm dưới {@link SUBJECT_FEED_TAG}.
 */
export const subjectFeedKey = (subjectId: string, locale: string, scope: FeedScope) => [
    "subject-feed",
    subjectId,
    locale,
    scope,
]

/**
 * SWR cache tag for a subject's "Thảo luận" feed. It deliberately STARTS WITH
 * {@link COMMUNITY_FEED_TAG} — exactly like `COMMUNITY_SEARCH_TAG` does — because the tab
 * renders the shared `CommunityFeedRow`, whose like / comment / edit / delete writes patch
 * every cache picked up by `communityFeedCacheKeys` (`$inf$…` keys containing the community
 * tag, holding an `Array<CommunityFeedPage>`). Drop the prefix and the row still renders but
 * every optimistic update silently misses this feed. Keep it.
 */
export const SUBJECT_FEED_TAG = `${COMMUNITY_FEED_TAG}-subject`

/** Page key: `["community-feed-subject", subjectId, locale, scope]`. */
export type SubjectFeedPageKey = readonly [string, string, string, FeedScope]

/**
 * Map a BE `Post` (subjectWorkspace.community) onto the SHARED community feed card contract —
 * a discussion post IS a community post carrying `subjectId`, so the tab renders the very same
 * row as `/community` instead of a second, drifting card.
 *
 * `author` is a batched `PublicUser` the gateway may leave NULL, so every read is
 * optional-chained; `avatarUrl` is carried through as `authorAvatar` instead of being dropped —
 * dropping it is what pushed the card onto a generated face. `snippet` goes through
 * {@link unwrapAutolinks} for the same reason the community mapper does it: the card prints the
 * excerpt as plain text, so a CommonMark autolink would leak its `<>` onto the screen. It then
 * goes through {@link splitBodyImages} for exactly the same reason — the row is the SAME
 * component, so an image typed into the body with the editor toolbar would print its raw
 * `![Ảnh](https://…)` here too, with no thumbnail; the extracted urls join `media`.
 */
const toSubjectFeedPost = (post: SubjectCommunityPost, locale: string): CommunityPost => {
    const { text, images } = splitBodyImages(unwrapAutolinks(post.snippet ?? post.body ?? ""))
    return {
        id: post.id,
        author: post.author?.displayName ?? post.author?.username ?? "",
        // Chỉ nhận username THẬT — rơi về id sẽ dựng link /u/<uuid> chết. Xem cùng lý do ở
        // useQueryCommunityFeedSwr.
        authorUsername: post.author?.username ?? "",
        authorAvatar: post.author?.avatarUrl ?? null,
        authorStaffRole: post.author?.staffRole ?? null,
        authorId: post.authorId ?? post.author?.id ?? null,
        pinned: post.pinned ?? false,
        timeLabel: formatRelativeTime(post.createdAt, locale),
        title: post.title ?? "",
        snippet: text,
        likes: post.likeCount,
        liked: post.likedByMe,
        comments: post.commentCount,
        media: [...toMediaItems(post.media), ...toBodyImageItems(images)],
    }
}

/**
 * Loads a subject's discussion feed from the real BE GraphQL
 * `subjectWorkspace(subjectId).community(scope: ...)` (a subject-scoped `PostConnection`).
 * Requires auth (viewer-scoped visibility); a guest / error surfaces via `error`
 * and the tab renders its empty/error state.
 *
 * ponytail: `useSWRInfinite` với ĐÚNG MỘT trang. Nó không phải phân trang thật —
 * `SubjectWorkspace.community(scope:)` không nhận `page: CursorInput`, resolver chốt cứng 20 bài
 * — mà là hình dạng cache bắt buộc: mutation lạc quan của `CommunityFeedRow` chỉ chạm các key
 * `$inf$` mang {@link COMMUNITY_FEED_TAG} và giả định giá trị là `Array<CommunityFeedPage>`.
 * Vì chỉ một trang nên tuyệt đối ĐỪNG gắn `InfiniteScrollSentinel` vào đây.
 */
export const useQuerySubjectFeedSwr = (subjectId: string, scope: FeedScope) => {
    const locale = useLocale()

    const getKey = (index: number): SubjectFeedPageKey | null =>
        subjectId && index === 0 ? [SUBJECT_FEED_TAG, subjectId, locale, scope] : null

    const fetchPage = async (): Promise<CommunityFeedPage> => {
        const result = await querySubjectCommunity({
            subjectId,
            scope: toSubjectFeedScope(scope),
        })
        const connection = result.data?.subjectWorkspace?.community
        return {
            items: (connection?.items ?? []).map((item) => toSubjectFeedPost(item, locale)),
            nextCursor: null,
        }
    }

    const { data, isLoading, isValidating, error, mutate } = useSWRInfinite<CommunityFeedPage>(
        getKey,
        fetchPage,
        { revalidateFirstPage: false },
    )

    const posts: Array<CommunityPost> = (data ?? []).flatMap((page) => page.items)
    const isLoadingInitial = isLoading || (isValidating && (data?.length ?? 0) === 0)

    return { posts, isLoading: isLoadingInitial, error, mutate }
}
