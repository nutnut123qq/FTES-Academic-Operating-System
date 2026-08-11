"use client"

import useSWR from "swr"

import { getFeImageComments, type FeImageCommentPage } from "@/modules/api/rest/resource"

/** SWR key for ONE album image's comment page (shared by the query + mutations). */
export const feImageCommentsSwrKey = (
    resourceId: string,
    imageId: string,
    page: number,
) => ["FE_IMAGE_COMMENTS_SWR", resourceId, imageId, page] as const

/** The SWR key tuple type for FE image comments. */
export type FeImageCommentsSwrKey = ReturnType<typeof feImageCommentsSwrKey>

/**
 * Loads one page of an FE album image's comment thread
 * (`GET /api/v1/resources/{id}/images/{imageId}/comments?page=&size=`). Top-level rows
 * carry one level of nested `replies`.
 *
 * The key carries the image id, so paging through the album swaps threads instead of
 * bleeding the previous picture's comments into the next one.
 *
 * @param resourceId - The FE resource holding the album.
 * @param imageId - The album image whose thread to read; `""` gates the fetch off.
 * @param page - 1-indexed page number (the BE contract is 1-based).
 * @returns The raw SWR handle over {@link FeImageCommentPage}.
 */
export const useQueryFeImageCommentsSwr = (
    resourceId: string,
    imageId: string,
    page: number,
) => {
    return useSWR<FeImageCommentPage, Error>(
        resourceId && imageId ? feImageCommentsSwrKey(resourceId, imageId, page) : null,
        () => getFeImageComments(resourceId, imageId, { page }),
    )
}
