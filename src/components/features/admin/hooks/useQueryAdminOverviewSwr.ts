"use client"

import useSWR from "swr"
import {
    getMyRbacPermissions,
    listRbacRoles,
} from "@/modules/api/rest/identity-rbac/identityRbac"

/**
 * The admin-console overview, derived from the identity RBAC REST endpoints the
 * signed-in admin can actually read:
 *   - `GET /identity/roles` (role.view) → role/grant totals across the platform.
 *   - `GET /identity/me/permissions` (authenticated) → the caller's own access.
 *
 * NOTE: the GraphQL admin cluster (`adminDashboard`/`adminUsers`/`rbacGrants`) is
 * gated behind `admin.*` permissions (e.g. `admin.rbac.read`, `admin.user.read`,
 * per-domain `analytics.dashboard.*`) that the standard ADMIN role does NOT hold,
 * so it 403s for this account. We surface only the honest, accessible figures here
 * rather than firing forbidden queries.
 */
export interface AdminOverview {
    /** Whether the caller is a super admin. */
    superAdmin: boolean
    /** The caller's own role codes (e.g. `ADMIN`). */
    myRoleCodes: Array<string>
    /** How many effective permissions the caller holds. */
    myPermissionCount: number
    /** How many distinct permission domains the caller can touch. */
    myDomainCount: number
    /** Total number of roles defined on the platform. */
    totalRoles: number
    /** How many of those roles are built-in/system roles. */
    systemRoles: number
    /** Total active grants across all roles (Σ grantCount). */
    totalGrants: number
    /** How many roles have at least one active grant. */
    activeRoles: number
    /** True when the caller's own access could not be loaded (me endpoint failed). */
    myAccessUnavailable: boolean
    /** True when the platform roles list could not be loaded. */
    rolesUnavailable: boolean
}

const fetchOverview = async (): Promise<AdminOverview> => {
    // Both are best-effort — either can degrade without breaking the dashboard.
    const [roles, me] = await Promise.all([
        listRbacRoles().catch(() => null),
        getMyRbacPermissions().catch(() => null),
    ])

    const totalRoles = roles?.length ?? 0
    const systemRoles = roles?.filter((role) => role.system).length ?? 0
    const totalGrants = roles?.reduce((sum, role) => sum + Number(role.grantCount ?? 0), 0) ?? 0
    const activeRoles = roles?.filter((role) => Number(role.grantCount ?? 0) > 0).length ?? 0

    const myRoleCodes = me?.roles.map((role) => role.code) ?? []
    const myPermissionCount = me?.permissions.length ?? 0
    const myDomainCount = me ? new Set(me.permissions.map((perm) => perm.domain)).size : 0

    return {
        superAdmin: me?.superAdmin ?? false,
        myRoleCodes,
        myPermissionCount,
        myDomainCount,
        totalRoles,
        systemRoles,
        totalGrants,
        activeRoles,
        myAccessUnavailable: me === null,
        rolesUnavailable: roles === null,
    }
}

/** Loads the admin-console overview from the accessible identity RBAC REST endpoints. */
export const useQueryAdminOverviewSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["admin", "overview"], fetchOverview)
    return { overview: data, isLoading, error, mutate }
}
