"use client"

import useSWR from "swr"

/** A comment on a post. Replies are flat, one level deep (Threads-like). */
export interface PostComment {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    text: string
    timeLabel: string
    /** One-level replies under this top-level comment (absent on replies). */
    replies?: Array<PostComment>
}

/** Full post detail (§6, mock until BE lands). */
export interface PostDetail {
    id: string
    /** Display name of the author. */
    author: string
    /** URL-facing username for profile link + hovercard. */
    authorUsername: string
    timeLabel: string
    title: string
    body: string
    likes: number
    /** Whether the current user has liked this post. */
    liked: boolean
    comments: Array<PostComment>
}

/** SWR cache key for a post's detail — shared by the detail page, the inline
 * comment thread, and the like/comment mutation hooks (ONE source of truth). */
export const postDetailKey = (postId: string) => ["post-detail", postId]

// ponytail: mock BE — no community endpoint yet. Derives from the id.
const fetchPostDetailMock = async (postId: string): Promise<PostDetail> => ({
    id: postId,
    author: "Minh Trần",
    authorUsername: "minh-tran" /* mock */,
    timeLabel: "1 giờ trước",
    title: "Chia sẻ lộ trình học Backend",
    body: "Mình tổng hợp lộ trình 6 tháng từ con số 0: tháng 1-2 nền tảng ngôn ngữ, tháng 3-4 database + API, tháng 5-6 dự án thật. Ai cần chi tiết comment nhé!",
    likes: 42,
    liked: false,
    comments: [
        {
            id: "pc1",
            author: "An",
            authorUsername: "an-nguyen" /* mock */,
            text: "Cảm ơn bạn, rất hữu ích!",
            timeLabel: "45 phút trước",
            replies: [
                { id: "pc1r1", author: "Minh Trần", authorUsername: "minh-tran" /* mock */, text: "Không có gì, chúc bạn học tốt!", timeLabel: "40 phút trước" },
            ],
        },
        { id: "pc2", author: "Hoa", authorUsername: "hoa-le" /* mock */, text: "Cho mình xin thêm tài liệu phần API với.", timeLabel: "20 phút trước" },
        {
            id: "pc3",
            author: "Bình",
            authorUsername: "binh-pham" /* mock */,
            text: "**Đỉnh** bạn ơi! Lộ trình rõ ràng:\n- Tháng 1-2: ngôn ngữ\n- Tháng 3-4: DB + API\nXem thêm [tại đây](/community/abc)\n![Yêu thích](/stickers/heart.svg)",
            timeLabel: "5 phút trước",
        }, // demo: rich markdown + sticker render
    ],
})

/** Loads a post's detail. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryPostDetailSwr = (postId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        postDetailKey(postId),
        () => fetchPostDetailMock(postId),
    )
    return { post: data, isLoading, error, mutate }
}

/**
 * Lazy variant used by the inline comment thread: fetches the SAME
 * `["post-detail", postId]` cache but only once the post is expanded (key is
 * `null` until then), so comments never load with the feed. Reusing the detail
 * cache keeps the inline thread, the detail page, and comment mutations in sync.
 *
 * @param postId - the post whose comments to load.
 * @param enabled - true once the post has been expanded at least once.
 */
export const useQueryPostCommentsSwr = (postId: string, enabled: boolean) => {
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? postDetailKey(postId) : null,
        () => fetchPostDetailMock(postId),
    )
    return { post: data, isLoading, error, mutate }
}
