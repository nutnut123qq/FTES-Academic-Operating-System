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

/** A follower / following user stub. */
export interface CommunityUser {
    id: string
    name: string
    /** Optional avatar URL; initials fallback when missing. */
    avatarUrl: string
    /** Short headline or username line. */
    headline: string
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
    /** Users following the viewer. */
    followers: Array<CommunityUser>
    /** Users the viewer is following. */
    following: Array<CommunityUser>
}

// ponytail: mock BE — no community-summary endpoint yet. Deterministic seed
// (score 187 mirrors the old profile reputation tile).
// Contract preview: BE will expose followers/following arrays for the viewer.
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
    followers: [
        {
            id: "u1",
            name: "Trần Thu Hà",
            avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
            headline: "Sinh viên KTPM",
        },
        {
            id: "u2",
            name: "Lê Minh Tú",
            avatarUrl: "",
            headline: "Lập trình viên backend",
        },
        {
            id: "u3",
            name: "Phạm Quang Huy",
            avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
            headline: "Sinh viên năm 4",
        },
    ],
    following: [
        {
            id: "u4",
            name: "Nguyễn Hoàng Anh",
            avatarUrl: "",
            headline: "Mentor AI/ML",
        },
        {
            id: "u5",
            name: "Vũ Thị Lan",
            avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
            headline: "Frontend engineer",
        },
    ],
})

/** Loads the viewer's community summary. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryMyCommunitySummarySwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["my-community-summary"], () => fetchMyCommunitySummaryMock())
    return { data, isLoading, error, mutate }
}
