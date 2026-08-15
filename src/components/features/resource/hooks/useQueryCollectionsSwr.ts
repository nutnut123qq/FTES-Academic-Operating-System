"use client"

import { useCallback } from "react"
import useSWR from "swr"
import {
    createCollection,
    getMyCollections,
    type CollectionResponse,
} from "@/modules/api/rest/resource"
import { RestError } from "@/modules/api/rest/client"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** A learning pack / resource collection row, mapped from the BE `CollectionResponse`. */
export interface ResourceCollection {
    /** Collection id — used for the detail fetch and the item mutations. */
    id: string
    title: string
    /** Never undefined: an absent BE description renders as an empty line. */
    description: string
    /** BE `itemCount`. */
    count: number
    /** `LEARNING_PACK` | `RESOURCE_COLLECTION`. */
    kind: string
    /** `PUBLIC` | `MEMBERS` | `PRIVATE` (BE `Visibility`). */
    visibility: string
}

/** SWR key of the signed-in viewer's collection list. */
export const COLLECTIONS_SWR_KEY = "QUERY_RESOURCE_COLLECTIONS_SWR"

/** Page size for `GET /resources/collections/me` (the BE pages, this list does not). */
const PAGE_SIZE = 50

/**
 * Kind used by the "Tạo bộ sưu tập" CTA. `LEARNING_PACK` is deliberately NOT used:
 * the BE rejects it without a `subjectId` and the hub form has no subject picker.
 */
export const DEFAULT_COLLECTION_KIND = "RESOURCE_COLLECTION"

/** Maps one BE collection row onto the list contract. */
export const toResourceCollection = (row: CollectionResponse): ResourceCollection => ({
    id: row.id,
    title: row.title?.trim() ?? "",
    description: row.description?.trim() ?? "",
    count: row.itemCount ?? 0,
    kind: row.kind,
    visibility: row.visibility,
})

/**
 * Buckets an API failure into an i18n key under `resourceHub.apiErrors.*` so the
 * resource surfaces say something actionable instead of leaking the raw envelope
 * message. Anything that is not a {@link RestError} (network/parse) → `generic`.
 */
export const resolveResourceErrorKey = (
    error: unknown,
): "unauthorized" | "forbidden" | "notFound" | "rateLimited" | "generic" => {
    if (!(error instanceof RestError)) {
        return "generic"
    }
    switch (error.status) {
        case 401:
            return "unauthorized"
        case 403:
            return "forbidden"
        case 404:
            return "notFound"
        case 429:
            return "rateLimited"
        default:
            return "generic"
    }
}

/**
 * Loads the signed-in viewer's resource collections from the real BE
 * (`GET /api/v1/resources/collections/me`). Auth-gated: the SWR key is `null` for
 * guests (the endpoint lists the CALLER's collections), so no 401 is ever fired —
 * the caller renders a sign-in CTA instead.
 *
 * `create` appends the new collection optimistically, POSTs it, swaps the temporary
 * row for the server row on success, and rolls the temporary row back on failure.
 */
export const useQueryCollectionsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()

    const { data, isLoading, error, mutate } = useSWR(
        authenticated && viewerId ? [COLLECTIONS_SWR_KEY, viewerId] : null,
        async () => (await getMyCollections({ page: 0, size: PAGE_SIZE })) ?? [],
    )

    const collections: Array<ResourceCollection> = (data ?? []).map(toResourceCollection)

    /**
     * Creates a collection owned by the current viewer.
     *
     * @param input - `title` (required, trimmed) plus an optional `description`.
     * @returns The persisted collection row.
     * @throws The underlying {@link RestError} after rolling the optimistic row back.
     */
    const create = useCallback(
        async (input: { title: string; description?: string }): Promise<CollectionResponse> => {
            const title = input.title.trim()
            const description = input.description?.trim() || undefined
            const temporaryId = `optimistic-${Date.now()}`
            const optimisticRow: CollectionResponse = {
                id: temporaryId,
                kind: DEFAULT_COLLECTION_KIND,
                title,
                description,
                ownerId: "",
                visibility: "MEMBERS",
                itemCount: 0,
                status: "ACTIVE",
            }

            // optimistic append, no revalidation (the POST answer is the source of truth)
            await mutate((current) => [...(current ?? []), optimisticRow], { revalidate: false })
            try {
                const created = await createCollection({
                    kind: DEFAULT_COLLECTION_KIND,
                    title,
                    description,
                })
                await mutate(
                    (current) =>
                        (current ?? []).map((row) => (row.id === temporaryId ? created : row)),
                    { revalidate: false },
                )
                return created
            } catch (createError) {
                // rollback: drop the optimistic row, then reconcile with the server
                await mutate((current) => (current ?? []).filter((row) => row.id !== temporaryId), {
                    revalidate: false,
                })
                void mutate()
                throw createError
            }
        },
        [mutate],
    )

    return {
        collections,
        /** False for guests (no request is made) so the sign-in CTA shows immediately. */
        isLoading: authenticated ? isLoading : false,
        error,
        authenticated,
        mutate,
        create,
    }
}
