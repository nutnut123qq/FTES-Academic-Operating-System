"use client"

import useSWR from "swr"
import {
    getMyCollections,
    type CollectionResponse,
} from "@/modules/api/rest/resource"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's own resource collections. */
export const MY_COLLECTIONS_SWR_KEY = "GET_MY_COLLECTIONS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyCollectionsSwr}. `null` disables
 * the fetch (guest, or the `me` query still in flight). Import this from a call site
 * that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myCollectionsKey = (
    viewerId: string | null,
    params?: { page?: number; size?: number },
) =>
    viewerId
        ? ([MY_COLLECTIONS_SWR_KEY, viewerId, params?.page, params?.size] as const)
        : null

/**
 * SWR query wrapper for {@link getMyCollections}.
 *
 * The key carries the VIEWER ID — collections include PRIVATE ones, which on the shared
 * key would be served to whoever signed in next in the same tab.
 */
export const useGetMyCollectionsSwr = (params?: {
    page?: number
    size?: number
}) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<Array<CollectionResponse>, Error>(
        authenticated ? myCollectionsKey(viewerId, params) : null,
        () => getMyCollections(params),
    )

    return swr
}
