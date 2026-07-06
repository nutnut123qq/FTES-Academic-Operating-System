"use client"

import useSWR from "swr"
import { listRbacRoles, type RbacRoleSummary } from "@/modules/api/rest/identity-rbac"

/**
 * SWR query wrapper for {@link listRbacRoles}.
 */
export const useGetRbacRolesSwr = () => {
    const swr = useSWR<RbacRoleSummary[], Error>("GET_RBAC_ROLES_SWR", () =>
        listRbacRoles(),
    )

    return swr
}
