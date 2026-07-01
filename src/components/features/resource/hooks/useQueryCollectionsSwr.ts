"use client"

import useSWR from "swr"

/** A learning pack / resource collection (§5, mock until BE lands). */
export interface ResourceCollection {
    id: string
    title: string
    description: string
    count: number
}

// ponytail: mock BE — no collections endpoint yet. Deterministic sample.
const fetchCollectionsMock = async (): Promise<Array<ResourceCollection>> => [
    { id: "c1", title: "Ôn thi PE nhập môn", description: "Đề mẫu + slide + source cho kỳ thi thực hành.", count: 8 },
    { id: "c2", title: "Bộ tài liệu Giải thuật", description: "Tổng hợp bài giảng + bài tập CSD201.", count: 12 },
    { id: "c3", title: "Java Web từ A-Z", description: "Slide, demo, đồ án mẫu cho PRJ301.", count: 15 },
]

/** Loads resource collections. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCollectionsSwr = () => {
    const { data, isLoading, error } = useSWR(["collections"], () => fetchCollectionsMock())
    return { collections: data ?? [], isLoading, error }
}
