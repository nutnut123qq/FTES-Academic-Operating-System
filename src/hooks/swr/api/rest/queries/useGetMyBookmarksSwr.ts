"use client"

import useSWR from "swr"
import { getMyBookmarks } from "@/modules/api/rest/resource"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's bookmarked resource ids. */
export const MY_BOOKMARKS_SWR_KEY = "GET_MY_BOOKMARKS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyBookmarksSwr}. `null` disables the
 * fetch (guest, or the `me` query still in flight). Import this from a call site that
 * needs to `mutate` the entry — never hand-write the tuple.
 */
export const myBookmarksKey = (
    viewerId: string | null,
    params?: { page?: number; size?: number },
) =>
    viewerId ? ([MY_BOOKMARKS_SWR_KEY, viewerId, params?.page, params?.size] as const) : null

/**
 * SWR query wrapper for {@link getMyBookmarks}.
 *
 * The key carries the VIEWER ID: paging params do not identify an account, so the
 * bookmark id list was one cache entry shared by everyone — B's bookmark stars would
 * light up on A's saved resources.
 */
export const useGetMyBookmarksSwr = (params?: {
    page?: number
    size?: number
}) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<Array<string>, Error>(
        authenticated ? myBookmarksKey(viewerId, params) : null,
        () => getMyBookmarks(params),
    )

    return swr
}
