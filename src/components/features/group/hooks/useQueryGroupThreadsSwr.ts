"use client"

import useSWR from "swr"

/** A discussion thread (§7, mock until BE lands). */
export interface GroupThread {
    id: string
    title: string
    author: string
    replies: number
}

// ponytail: mock BE — no discussion endpoint yet. Deterministic sample.
const fetchThreadsMock = async (): Promise<Array<GroupThread>> => [
    { id: "th1", title: "Nên học framework nào sau khi xong C?", author: "Minh", replies: 18 },
    { id: "th2", title: "Chia sẻ đề thi PE các kỳ trước", author: "An", replies: 9 },
    { id: "th3", title: "Tìm bạn cùng làm dự án cuối kỳ", author: "Hoa", replies: 24 },
]

/** Loads a group's discussion threads. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupThreadsSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group-threads", groupId], () => fetchThreadsMock())
    return { threads: data ?? [], isLoading, error }
}
