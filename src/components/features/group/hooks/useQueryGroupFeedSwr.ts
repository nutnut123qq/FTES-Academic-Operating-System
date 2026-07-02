"use client"

import useSWR from "swr"

/** A group post (§7, mock until BE lands). */
export interface GroupPost {
    id: string
    author: string
    timeLabel: string
    text: string
    /** Seeded like count (no group-post reaction contract on the BE yet). */
    likes: number
    /** Whether the current user has liked this post. */
    liked: boolean
    /** Seeded comment count for the engagement bar. */
    comments: number
}

/** SWR cache key for a group's feed (shared with the group like mutation hook). */
export const groupFeedKey = (groupId: string) => ["group-feed", groupId]

// ponytail: mock BE — no group feed endpoint yet. Deterministic sample.
const fetchGroupFeedMock = async (): Promise<Array<GroupPost>> => [
    { id: "gp1", author: "Ban chủ nhiệm", timeLabel: "2 giờ trước", text: "Tuần này CLB có workshop về Git lúc 19h thứ 6 nhé!", likes: 15, liked: false, comments: 4 },
    { id: "gp2", author: "Minh", timeLabel: "hôm qua", text: "Ai có tài liệu ôn thuật toán cho mình xin với ạ.", likes: 3, liked: false, comments: 2 },
    { id: "gp3", author: "Hoa", timeLabel: "2 ngày trước", text: "Mình vừa share bộ slide buổi trước trong tab Tài nguyên.", likes: 21, liked: true, comments: 6 },
]

/** Loads a group's feed. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupFeedSwr = (groupId: string) => {
    const { data, isLoading, error, mutate } = useSWR(groupFeedKey(groupId), () => fetchGroupFeedMock())
    return { posts: data ?? [], isLoading, error, mutate }
}
