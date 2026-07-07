"use client"

import useSWR from "swr"

/** A trending post entry (§6, mock until BE lands). */
export interface TrendingPost {
    id: string
    title: string
    author: string
    likes: number
}

// ponytail: mock BE — no trending endpoint yet. Deterministic sample (by likes).
const fetchTrendingMock = async (): Promise<Array<TrendingPost>> => [
    { id: "cp3", title: "Khoe chứng chỉ AWS đầu tiên", author: "Hoa Lê", likes: 130 },
    { id: "cp1", title: "Chia sẻ lộ trình học Backend", author: "Minh Trần", likes: 42 },
    { id: "cp5", title: "Tổng hợp mẹo phỏng vấn intern", author: "Đức Phạm", likes: 38 },
    { id: "cp2", title: "Hỏi về đồ án SWP391", author: "An Nguyễn", likes: 8 },
]

/** Loads trending posts. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryTrendingSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["trending"], () => fetchTrendingMock())
    return { trending: data ?? [], isLoading, error, mutate }
}
