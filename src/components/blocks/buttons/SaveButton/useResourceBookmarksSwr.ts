"use client"

import useSWR from "swr"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { listMyBookmarks } from "@/modules/api/rest/resource"

/** SWR cache tag of the signed-in user's bookmarked resource ids. */
export const RESOURCE_BOOKMARKS_TAG = "resource-bookmarks"

/**
 * The single SWR key every {@link SaveButton} on the page shares, so one row
 * hydrating the list serves all of them (and a toggle patches one cache entry).
 */
export const resourceBookmarksKey = (viewerId: string) =>
    [RESOURCE_BOOKMARKS_TAG, viewerId] as const

/** How many bookmark ids are hydrated in one shot (BE caps the page size). */
const BOOKMARKS_PAGE_SIZE = 200

/**
 * Hydrates the saved-state of RESOURCE entities from
 * `GET /api/v1/resources/me/bookmarks` (server truth, unlike the localStorage
 * saved-items store used by course/post rows).
 *
 * Guests and non-resource buttons pass through with a `null` key → no request.
 * `data` stays `undefined` until the list resolves, which callers read as
 * "unknown, fall back to the local store" rather than "not saved".
 *
 * @param enabled - whether this button actually saves a resource.
 * @returns `bookmarkedIds` (a `Set`, or `undefined` while unknown), the loading
 * flag and `mutate` for optimistic cache patches.
 */
export const useResourceBookmarksSwr = (enabled: boolean) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const active = enabled && Boolean(authenticated)

    const { data, isLoading, mutate } = useSWR(
        active && viewerId ? resourceBookmarksKey(viewerId) : null,
        async () => {
            const ids = await listMyBookmarks({ page: 0, size: BOOKMARKS_PAGE_SIZE })
            return new Set<string>(ids ?? [])
        },
        { revalidateOnFocus: false, dedupingInterval: 30_000 },
    )

    return { bookmarkedIds: data, isLoading, mutate }
}
