"use client"

import useSWR from "swr"

/** One of the viewer's recent community posts. */
export interface MyCommunityPost {
    /** Community post id — row links to `/community/<id>`. */
    id: string
    title: string
    /** Human date line (mock — BE will send a timestamp). */
    dateLabel: string
    likeCount: number
    commentCount: number
}

/** Community summary payload for the profile Community tab. */
export interface MyCommunitySummary {
    reputation: {
        score: number
        posts: number
        comments: number
        /** Reactions received on the viewer's content. */
        reactions: number
    }
    recentPosts: Array<MyCommunityPost>
}

// ponytail: mock BE — no community-summary endpoint yet. Deterministic seed
// (score 187 mirrors the old profile reputation tile).
const fetchMyCommunitySummaryMock = async (): Promise<MyCommunitySummary> => ({
    reputation: { score: 187, posts: 12, comments: 48, reactions: 230 },
    recentPosts: [
        {
            id: "p1",
            title: "Con trỏ trong C: mẹo debug segfault nhanh",
            dateLabel: "2 ngày trước",
            likeCount: 24,
            commentCount: 6,
        },
        {
            id: "p2",
            title: "So sánh Goroutine vs Thread cho bài lab OSG202",
            dateLabel: "1 tuần trước",
            likeCount: 41,
            commentCount: 12,
        },
        {
            id: "p3",
            title: "Chia sẻ lộ trình ôn PRF192 trong 3 tuần",
            dateLabel: "3 tuần trước",
            likeCount: 58,
            commentCount: 19,
        },
    ],
})

/** Loads the viewer's community summary. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryMyCommunitySummarySwr = () => {
    const { data, isLoading, error } = useSWR(["my-community-summary"], () => fetchMyCommunitySummaryMock())
    return { data, isLoading, error }
}
