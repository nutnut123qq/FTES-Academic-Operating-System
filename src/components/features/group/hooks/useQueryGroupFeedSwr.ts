"use client"

import useSWR from "swr"

/** A group post (§7, mock until BE lands). */
export interface GroupPost {
    id: string
    author: string
    timeLabel: string
    text: string
}

// ponytail: mock BE — no group feed endpoint yet. Deterministic sample.
const fetchGroupFeedMock = async (): Promise<Array<GroupPost>> => [
    { id: "gp1", author: "Ban chủ nhiệm", timeLabel: "2 giờ trước", text: "Tuần này CLB có workshop về Git lúc 19h thứ 6 nhé!" },
    { id: "gp2", author: "Minh", timeLabel: "hôm qua", text: "Ai có tài liệu ôn thuật toán cho mình xin với ạ." },
    { id: "gp3", author: "Hoa", timeLabel: "2 ngày trước", text: "Mình vừa share bộ slide buổi trước trong tab Tài nguyên." },
]

/** Loads a group's feed. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupFeedSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group-feed", groupId], () => fetchGroupFeedMock())
    return { posts: data ?? [], isLoading, error }
}
