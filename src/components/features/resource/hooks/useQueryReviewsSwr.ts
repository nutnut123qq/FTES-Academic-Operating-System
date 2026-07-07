"use client"

import useSWR from "swr"

/** A resource review (§5, mock until BE lands). */
export interface Review {
    id: string
    author: string
    rating: number
    text: string
}

// ponytail: mock BE — no reviews endpoint yet. Deterministic sample.
const fetchReviewsMock = async (resourceId: string): Promise<Array<Review>> => [
    { id: "rv1", author: "Minh", rating: 5, text: "Rất hữu ích cho kỳ thi." },
    { id: "rv2", author: "An", rating: 4, text: "Nội dung tốt, thiếu vài ví dụ." },
]

/** Loads a resource's reviews. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryReviewsSwr = (resourceId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["reviews", resourceId],
        () => fetchReviewsMock(resourceId),
    )
    return { reviews: data ?? [], isLoading, error, mutate }
}
