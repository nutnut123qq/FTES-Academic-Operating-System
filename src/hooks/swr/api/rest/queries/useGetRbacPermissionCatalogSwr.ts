"use client"

import useSWR from "swr"
import {
    getRbacPermissionCatalog,
    type RbacPermissionDomainGroup,
} from "@/modules/api/rest/identity-rbac"

/**
 * SWR query wrapper for {@link getRbacPermissionCatalog}.
 */
export const useGetRbacPermissionCatalogSwr = (domain?: string) => {
    const swr = useSWR<RbacPermissionDomainGroup[], Error>(
        ["GET_RBAC_PERMISSION_CATALOG_SWR", domain],
        () => getRbacPermissionCatalog(domain),
    )

    return swr
}
