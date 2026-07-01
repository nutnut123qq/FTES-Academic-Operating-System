"use client"

import useSWR from "swr"

/** A comment on a resource. */
export interface ResourceComment {
    id: string
    author: string
    text: string
}

/** Full resource detail (§5, mock until BE lands). */
export interface ResourceDetail {
    id: string
    title: string
    subject: string
    sizeLabel: string
    rating: number
    comments: Array<ResourceComment>
}

// ponytail: mock BE — no resource endpoint yet. Derives from the id.
const fetchResourceDetailMock = async (resourceId: string): Promise<ResourceDetail> => ({
    id: resourceId,
    title: "Giáo trình PRF192 (bản đầy đủ)",
    subject: "PRF192",
    sizeLabel: "8.4 MB",
    rating: 4.6,
    comments: [
        { id: "cm1", author: "Minh", text: "Tài liệu rất đầy đủ, cảm ơn!" },
        { id: "cm2", author: "An", text: "Phần con trỏ giải thích dễ hiểu." },
    ],
})

/** Loads a resource's detail. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryResourceDetailSwr = (resourceId: string) => {
    const { data, isLoading, error } = useSWR(
        ["resource-detail", resourceId],
        () => fetchResourceDetailMock(resourceId),
    )
    return { resource: data, isLoading, error }
}
