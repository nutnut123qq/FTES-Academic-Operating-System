"use client"

import useSWRMutation from "swr/mutation"

import { deleteFeAlbumImage } from "@/modules/api/rest/resource"

/** Trigger arg for {@link useMutateDeleteFeAlbumImageSwr}. */
export interface DeleteFeAlbumImageParams {
    /** The FE resource (album) the picture belongs to. */
    resourceId: string
    /** The picture to drop. */
    imageId: string
}

/**
 * Removes one picture from an FE album
 * (`DELETE /api/v1/resources/{id}/images/{imageId}`).
 *
 * Destructive and NOT soft — the picture and its comment thread go with it, so the
 * caller must confirm first. Resolves `true` rather than the endpoint's empty body so a
 * caller can tell a successful delete from a swallowed failure. Authorization is the
 * server's call (resource owner or subject curator); a `403` propagates as a
 * `RestError` for the caller to word.
 *
 * @returns The `useSWRMutation` handle (`trigger` / `isMutating`).
 */
export const useMutateDeleteFeAlbumImageSwr = () => {
    return useSWRMutation<boolean, Error, string, DeleteFeAlbumImageParams>(
        "DELETE_FE_ALBUM_IMAGE_SWR",
        async (_key, { arg }) => {
            await deleteFeAlbumImage(arg.resourceId, arg.imageId)
            return true
        },
    )
}
