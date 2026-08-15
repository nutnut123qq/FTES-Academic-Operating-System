"use client"

import useSWR from "swr"
import {
    getMyRbacPermissions,
    type RbacMePermissionsResponse,
} from "@/modules/api/rest/identity-rbac"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's effective RBAC permission set. */
export const MY_RBAC_PERMISSIONS_SWR_KEY = "GET_MY_RBAC_PERMISSIONS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyRbacPermissionsSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple, or the
 * mutate silently stops matching the key the hook reads under.
 */
export const myRbacPermissionsKey = (viewerId: string | null) =>
    viewerId ? ([MY_RBAC_PERMISSIONS_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyRbacPermissions}.
 *
 * This is the MOST dangerous entry in this family to leave globally keyed: the answer
 * is the caller's effective permission set, and the UI hides/shows admin affordances
 * from it. On a bare `"GET_MY_RBAC_PERMISSIONS_SWR"` key, signing out of an admin and
 * into a student in the SAME TAB re-keys to that identical cache entry, so the student
 * is painted the admin's permissions (stale-while-revalidate serves them instantly and,
 * inside `dedupingInterval`, without even re-fetching) — moderation buttons and staff
 * menus appear for an account that has none of those rights. The BE still rejects the
 * calls, but the client has already leaked WHO the previous account was and what it
 * could do. Keying on the viewer id makes the admin's entry unreachable from the
 * student's key, and gating on a resolved viewer keeps a half-hydrated session from
 * writing an unattributable answer into the cache.
 */
export const useGetMyRbacPermissionsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<RbacMePermissionsResponse, Error>(
        authenticated ? myRbacPermissionsKey(viewerId) : null,
        () => getMyRbacPermissions(),
    )

    return swr
}
