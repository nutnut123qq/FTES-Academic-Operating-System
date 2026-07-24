"use client"

import useSWR from "swr"

import { getResourceComments, type ResourceCommentsPage } from "@/modules/api/rest/resource"

/** SWR key for a resource's comments page (shared by the query + mutations). */
export const resourceCommentsSwrKey = (resourceId: string, page: number) =>
    ["RESOURCE_COMMENTS_SWR", resourceId, page] as const

/** The SWR key tuple type for resource comments. */
export type ResourceCommentsSwrKey = ReturnType<typeof resourceCommentsSwrKey>

/**
 * Loads one page of a resource's threaded Q&A comments from the real C-4 BE
 * (`GET /api/v1/resources/{id}/comments?page=&size=`). Top-level comments carry
 * one level of nested `replies`. Gated on `resourceId`; read access is enforced
 * server-side by the resource `VisibilityGuard`. Mirrors `useGetLessonCommentsSwr`.
 *
 * @param resourceId - The resource whose comments to load.
 * @param page - 1-indexed page number.
 */
export const useQueryResourceCommentsSwr = (resourceId: string, page: number) => {
    return useSWR<ResourceCommentsPage, Error>(
        resourceId ? resourceCommentsSwrKey(resourceId, page) : null,
        () => getResourceComments(resourceId, { page }),
    )
}
