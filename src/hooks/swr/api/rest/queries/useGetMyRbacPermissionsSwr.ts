"use client"

import useSWR from "swr"
import {
    getMyRbacPermissions,
    type RbacMePermissionsResponse,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR query wrapper for {@link getMyRbacPermissions}.
 */
export const useGetMyRbacPermissionsSwr = () => {
    const swr = useSWR<RbacMePermissionsResponse, Error>(
        "GET_MY_RBAC_PERMISSIONS_SWR",
        () => getMyRbacPermissions(),
    )

    return swr
}
