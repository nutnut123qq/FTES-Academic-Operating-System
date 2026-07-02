"use client"

import useSWR from "swr"

import { fetchResourceCommentsMock } from "./resource-comments-mock"
import type { ResourceCommentItem } from "./resource-comments-mock"

/** SWR key for a resource's comments (shared by the query + all mutations). */
export const resourceCommentsSwrKey = (resourceId: string) =>
    ["resource-comments", resourceId] as const

/** The SWR key tuple type for resource comments. */
export type ResourceCommentsSwrKey = ReturnType<typeof resourceCommentsSwrKey>

/**
 * Loads a resource's comments (flat list; the UI groups replies under their
 * top-level parent). Mocked; SWR-shaped for a drop-in BE swap — mirrors
 * `useQueryReviewsSwr`.
 * @param resourceId - The resource whose comments to load.
 */
export const useQueryResourceCommentsSwr = (resourceId: string) => {
    const { data, isLoading, error, mutate } = useSWR<Array<ResourceCommentItem>>(
        resourceId ? resourceCommentsSwrKey(resourceId) : null,
        ([, id]: ResourceCommentsSwrKey) => fetchResourceCommentsMock(id),
    )
    return { comments: data, isLoading, error, mutate }
}
