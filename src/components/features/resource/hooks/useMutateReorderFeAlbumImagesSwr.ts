"use client"

import useSWRMutation from "swr/mutation"

import { reorderFeAlbumImages } from "@/modules/api/rest/resource"
import { isFeAlbumPermutation } from "./feAlbumManage"

/** Trigger arg for {@link useMutateReorderFeAlbumImagesSwr}. */
export interface ReorderFeAlbumImagesParams {
    /** The FE resource (album) being reordered. */
    resourceId: string
    /**
     * The album's ids in their NEW order. MUST be the whole album — see
     * {@link currentImageIds}.
     */
    imageIds: Array<string>
    /**
     * The album's ids as the server last reported them, used to assert the payload is a
     * complete permutation before the request leaves the browser.
     */
    currentImageIds: Array<string>
}

/**
 * Rewrites an FE album's picture order (`PUT /api/v1/resources/{id}/images/order`).
 *
 * The BE takes the WHOLE album or nothing: `imageIds` has to be a complete permutation
 * of the album's ids, and a partial list is a `400`. A "move this one picture up"
 * gesture therefore sends every id, and the payload is checked with
 * {@link isFeAlbumPermutation} first so a UI bug fails loudly here instead of arriving
 * as an opaque validation error.
 *
 * Resolves `true` rather than the endpoint's empty body, so the caller can tell a
 * successful write from a swallowed failure.
 *
 * @returns The `useSWRMutation` handle (`trigger` / `isMutating`).
 */
export const useMutateReorderFeAlbumImagesSwr = () => {
    return useSWRMutation<boolean, Error, string, ReorderFeAlbumImagesParams>(
        "PUT_REORDER_FE_ALBUM_IMAGES_SWR",
        async (_key, { arg }) => {
            if (!isFeAlbumPermutation(arg.imageIds, arg.currentImageIds)) {
                throw new Error(
                    "FE album reorder must send a complete permutation of the album's image ids",
                )
            }
            await reorderFeAlbumImages(arg.resourceId, { imageIds: arg.imageIds })
            return true
        },
    )
}
