"use client"

import useSWR from "swr"

import { getFeAlbum, type FeAlbumView } from "@/modules/api/rest/resource"

/** SWR key for one FE album (shared by the query + the image mutations). */
export const feAlbumSwrKey = (resourceId: string) =>
    ["FE_ALBUM_SWR", resourceId] as const

/**
 * Loads the image album of an FE resource (`GET /api/v1/resources/{id}/images`).
 *
 * Gated on `resourceId`; read access is enforced server-side by the resource
 * `VisibilityGuard`. The BE ships the album already ordered by `sortOrder` plus the
 * `maxImages` cap, so neither is computed client-side.
 *
 * @param resourceId - The FE resource whose album to load.
 * @returns The raw SWR handle over {@link FeAlbumView}.
 */
export const useQueryFeAlbumSwr = (resourceId: string) => {
    return useSWR<FeAlbumView, Error>(
        resourceId ? feAlbumSwrKey(resourceId) : null,
        () => getFeAlbum(resourceId),
    )
}
