"use client"

import useSWR from "swr"
import { getRbacRole, type RbacRoleView } from "@/modules/api/rest/identity-rbac"

/**
 * SWR query wrapper for {@link getRbacRole}.
 */
export const useGetRbacRoleSwr = (id: string) => {
    const swr = useSWR<RbacRoleView, Error>(["GET_RBAC_ROLE_SWR", id], () =>
        getRbacRole(id),
    )

    return swr
}
