"use client"

import useSWR from "swr"
import {
    listRbacUserPermissionGrants,
    type RbacPermissionGrantView,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR query wrapper for {@link listRbacUserPermissionGrants}.
 */
export const useGetRbacUserPermissionGrantsSwr = (userId: string) => {
    const swr = useSWR<RbacPermissionGrantView[], Error>(
        ["GET_RBAC_USER_PERMISSION_GRANTS_SWR", userId],
        () => listRbacUserPermissionGrants(userId),
    )

    return swr
}
