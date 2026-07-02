"use client"

import useSWR from "swr"

/** Feed filter scope. */
export type FeedScope = "forYou" | "following" | "trending"

/** A subject community post (mock until BE lands). */
export interface SubjectPost {
    id: string
    author: string
    timeLabel: string
    title: string
    snippet: string
    reactions: number
    /** Whether the current user has liked this post (drives optimistic toggle). */
    liked: boolean
    /** Comment count for the discussion engagement bar. */
    comments: number
}

/** SWR cache key for a subject's "Thảo luận" feed (shared with the like hook). */
export const subjectFeedKey = (subjectId: string, scope: FeedScope) => [
    "subject-feed",
    subjectId,
    scope,
]

// ponytail: mock BE — no community endpoint yet. Deterministic sample; the scope
// arg is accepted so the real query is a drop-in.
const fetchFeedMock = async (scope: FeedScope): Promise<Array<SubjectPost>> => {
    const base: Array<SubjectPost> = [
        { id: "p1", author: "Minh Trần", timeLabel: "2 giờ trước", title: "Mẹo debug con trỏ trong C", snippet: "Chia sẻ vài cách mình hay dùng khi bị segfault…", reactions: 12, liked: false, comments: 4 },
        { id: "p2", author: "An Nguyễn", timeLabel: "hôm qua", title: "Hỏi về đề PE tuần này", snippet: "Có ai làm câu 3 phần mảng 2 chiều chưa nhỉ?", reactions: 5, liked: false, comments: 2 },
        { id: "p3", author: "Hoa Lê", timeLabel: "3 ngày trước", title: "Tổng hợp tài liệu ôn cuối kỳ", snippet: "Mình gom slide + đề mẫu vào một chỗ cho tiện…", reactions: 34, liked: true, comments: 9 },
    ]
    if (scope === "trending") return [...base].sort((a, b) => b.reactions - a.reactions)
    return base
}

/** Loads a subject's community feed for a scope. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectFeedSwr = (subjectId: string, scope: FeedScope) => {
    const { data, isLoading, error, mutate } = useSWR(
        subjectFeedKey(subjectId, scope),
        () => fetchFeedMock(scope),
    )
    return { posts: data ?? [], isLoading, error, mutate }
}
