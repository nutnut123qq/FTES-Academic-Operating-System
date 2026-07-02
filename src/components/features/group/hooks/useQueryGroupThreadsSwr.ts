"use client"

import useSWR from "swr"

/** A discussion thread (§7, mock until BE lands). */
export interface GroupThread {
    id: string
    title: string
    author: string
    replies: number
    /** Like count for the discussion engagement bar. */
    likes: number
    /** Whether the current user has liked this thread. */
    liked: boolean
}

/** SWR cache key for a group's discussion threads (shared with the like hook). */
export const groupThreadsKey = (groupId: string) => ["group-threads", groupId]

// ponytail: mock BE — no discussion endpoint yet. Deterministic sample.
const fetchThreadsMock = async (): Promise<Array<GroupThread>> => [
    { id: "th1", title: "Nên học framework nào sau khi xong C?", author: "Minh", replies: 18, likes: 7, liked: false },
    { id: "th2", title: "Chia sẻ đề thi PE các kỳ trước", author: "An", replies: 9, likes: 3, liked: false },
    { id: "th3", title: "Tìm bạn cùng làm dự án cuối kỳ", author: "Hoa", replies: 24, likes: 12, liked: true },
]

/** Loads a group's discussion threads. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupThreadsSwr = (groupId: string) => {
    const { data, isLoading, error, mutate } = useSWR(groupThreadsKey(groupId), () => fetchThreadsMock())
    return { threads: data ?? [], isLoading, error, mutate }
}
