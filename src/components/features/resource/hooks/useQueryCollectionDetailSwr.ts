"use client"

import { useCallback } from "react"
import useSWR from "swr"
import {
    getCollectionDetail,
    removeCollectionItem,
    type CollectionDetailResponse,
} from "@/modules/api/rest/resource"
import { useAppSelector } from "@/redux/hooks"

/** SWR key prefix of a single collection detail aggregate. */
export const COLLECTION_DETAIL_SWR_KEY = "QUERY_RESOURCE_COLLECTION_DETAIL_SWR"

/**
 * Loads one collection with its items from the real BE
 * (`GET /api/v1/resources/collections/{id}`) — the row-click detail of the
 * collections list. Auth-gated and lazy: the key is `null` for guests and while no
 * collection is selected, so opening the page fires nothing.
 *
 * `removeItem` drops the row optimistically, fires
 * `DELETE /resources/collections/{id}/items/{resourceId}` and re-fetches (rollback)
 * when the delete fails.
 *
 * @param collectionId - Selected collection id; `null`/`undefined` disables the fetch.
 */
export const useQueryCollectionDetailSwr = (collectionId?: string | null) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enabled = authenticated && Boolean(collectionId)

    const { data, isLoading, error, mutate } = useSWR(
        enabled ? [COLLECTION_DETAIL_SWR_KEY, collectionId] : null,
        ([, id]) => getCollectionDetail(id as string),
    )

    /**
     * Removes one resource from the open collection.
     *
     * @param resourceId - Resource id of the item row (NOT the collection-item id —
     * the BE deletes by resource id).
     * @throws The underlying `RestError` after restoring the row.
     */
    const removeItem = useCallback(
        async (resourceId: string): Promise<void> => {
            if (!collectionId) {
                return
            }
            const drop = (current: CollectionDetailResponse | undefined) =>
                current
                    ? {
                          ...current,
                          collection: {
                              ...current.collection,
                              itemCount: Math.max(0, (current.collection.itemCount ?? 1) - 1),
                          },
                          items: current.items.filter((item) => item.resourceId !== resourceId),
                      }
                    : current

            await mutate((current) => drop(current), { revalidate: false })
            try {
                await removeCollectionItem(collectionId, resourceId)
            } catch (removeError) {
                // rollback: re-fetch so the item (and the count) come back
                await mutate()
                throw removeError
            }
        },
        [collectionId, mutate],
    )

    return {
        collection: data?.collection ?? null,
        items: data?.items ?? [],
        isLoading: enabled ? isLoading : false,
        error,
        mutate,
        removeItem,
    }
}
