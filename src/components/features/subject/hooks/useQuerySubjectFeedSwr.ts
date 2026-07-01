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
}

// ponytail: mock BE — no community endpoint yet. Deterministic sample; the scope
// arg is accepted so the real query is a drop-in.
const fetchFeedMock = async (scope: FeedScope): Promise<Array<SubjectPost>> => {
    const base: Array<SubjectPost> = [
        { id: "p1", author: "Minh Trần", timeLabel: "2 giờ trước", title: "Mẹo debug con trỏ trong C", snippet: "Chia sẻ vài cách mình hay dùng khi bị segfault…", reactions: 12 },
        { id: "p2", author: "An Nguyễn", timeLabel: "hôm qua", title: "Hỏi về đề PE tuần này", snippet: "Có ai làm câu 3 phần mảng 2 chiều chưa nhỉ?", reactions: 5 },
        { id: "p3", author: "Hoa Lê", timeLabel: "3 ngày trước", title: "Tổng hợp tài liệu ôn cuối kỳ", snippet: "Mình gom slide + đề mẫu vào một chỗ cho tiện…", reactions: 34 },
    ]
    if (scope === "trending") return [...base].sort((a, b) => b.reactions - a.reactions)
    return base
}

/** Loads a subject's community feed for a scope. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectFeedSwr = (subjectId: string, scope: FeedScope) => {
    const { data, isLoading, error } = useSWR(
        ["subject-feed", subjectId, scope],
        () => fetchFeedMock(scope),
    )
    return { posts: data ?? [], isLoading, error }
}
