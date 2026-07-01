"use client"

import useSWR from "swr"

/** A recommended resource (§5/§17, mock until BE lands). */
export interface RecommendedResource {
    id: string
    title: string
    reason: string
}

// ponytail: mock BE — no recommendation endpoint yet. Deterministic sample.
const fetchRecommendedMock = async (): Promise<Array<RecommendedResource>> => [
    { id: "rc1", title: "Slide CSD201 — Sắp xếp", reason: "Vì bạn đang học PRF192" },
    { id: "rc2", title: "Đề FE mẫu DBI202", reason: "Phổ biến trong môn của bạn" },
    { id: "rc3", title: "Source code Java Web", reason: "Nhiều người cùng khóa đã tải" },
]

/** Loads recommended resources. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryRecommendedSwr = () => {
    const { data, isLoading, error } = useSWR(["recommended"], () => fetchRecommendedMock())
    return { recommended: data ?? [], isLoading, error }
}
