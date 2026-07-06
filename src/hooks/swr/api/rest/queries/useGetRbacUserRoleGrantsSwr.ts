"use client"

import useSWR from "swr"
import {
    listRbacUserRoleGrants,
    type RbacRoleGrantView,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR query wrapper for {@link listRbacUserRoleGrants}.
 */
export const useGetRbacUserRoleGrantsSwr = (userId: string) => {
    const swr = useSWR<RbacRoleGrantView[], Error>(
        ["GET_RBAC_USER_ROLE_GRANTS_SWR", userId],
        () => listRbacUserRoleGrants(userId),
    )

    return swr
}
