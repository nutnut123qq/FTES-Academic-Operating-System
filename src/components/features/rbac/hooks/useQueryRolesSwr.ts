"use client"

import useSWR from "swr"
import { getRbacRole, listRbacRoles } from "@/modules/api/rest/identity-rbac/identityRbac"

/**
 * A system role in the RBAC model (§1 Authorization) — flattened from the BE
 * `RbacRoleSummary` (list) + `RbacRoleView` (detail, for `permissionCodes`).
 */
export interface Role {
    /** Role uuid (BE `id`). */
    id: string
    /** Stable role code, e.g. `ADMIN`, `CTV`, `STUDENT`. */
    code: string
    /** Human-readable role name. */
    name: string
    /** True for built-in/system roles (cannot be deleted). */
    system: boolean
    /** Number of active grants of this role (its "member count"). */
    grantCount: number
    /** Scope types this role may be granted at (GLOBAL, GROUP, SUBJECT, …). */
    allowedScopeTypes: Array<string>
    /** Permission codes this role grants (from the per-role detail fetch). */
    permissionCodes: Array<string>
}

/** A permission domain group for the matrix rows (codes grouped by their `domain.` prefix). */
export interface PermissionGroup {
    /** Domain prefix, e.g. `course`, `user`, `community`. */
    domain: string
    /** Sorted permission codes in this domain. */
    codes: Array<string>
}

/** Shape returned by the hook: the role list, the permission groups, and the grant lookup. */
export interface RolesData {
    roles: Array<Role>
    /** Union of every role's permission codes, grouped by domain (matrix rows). */
    permissionGroups: Array<PermissionGroup>
    /** Per role id → set of granted permission codes (matrix cells). */
    grants: Record<string, Set<string>>
}

/** Derive the domain bucket from a permission code (`course.publish` → `course`). */
const domainOf = (code: string): string => {
    const dot = code.indexOf(".")
    return dot === -1 ? code : code.slice(0, dot)
}

/**
 * Loads the real RBAC roles + permission grants from the identity REST module.
 * `GET /identity/roles` (role.view) gives the summaries; each role's `permissionCodes`
 * come from `GET /identity/roles/{id}` (role.view). The union of codes, grouped by
 * domain, forms the permission-matrix rows; per-role code sets form the cells.
 */
const fetchRoles = async (): Promise<RolesData> => {
    const summaries = await listRbacRoles()
    // Fetch each role's permission codes; tolerate a single role 403/erroring
    // (keep the rest — the matrix just shows that role as granting nothing).
    const details = await Promise.all(
        summaries.map((summary) => getRbacRole(summary.id).catch(() => null)),
    )

    const roles: Array<Role> = summaries.map((summary, index) => ({
        id: summary.id,
        code: summary.code,
        name: summary.name,
        system: summary.system,
        grantCount: Number(summary.grantCount ?? 0),
        allowedScopeTypes: summary.allowedScopeTypes ?? [],
        permissionCodes: details[index]?.permissionCodes ?? [],
    }))

    // Union of every code, sorted, grouped by domain → matrix rows.
    const allCodes = new Set<string>()
    roles.forEach((role) => role.permissionCodes.forEach((code) => allCodes.add(code)))
    const sorted = Array.from(allCodes).sort((a, b) => a.localeCompare(b))
    const byDomain = new Map<string, Array<string>>()
    sorted.forEach((code) => {
        const domain = domainOf(code)
        const bucket = byDomain.get(domain)
        if (bucket) {
            bucket.push(code)
        } else {
            byDomain.set(domain, [code])
        }
    })
    const permissionGroups: Array<PermissionGroup> = Array.from(byDomain.entries()).map(
        ([domain, codes]) => ({ domain, codes }),
    )

    // Per-role granted set → O(1) cell lookup.
    const grants: Record<string, Set<string>> = {}
    roles.forEach((role) => {
        grants[role.id] = new Set(role.permissionCodes)
    })

    return { roles, permissionGroups, grants }
}

/** Loads the RBAC roles + permission matrix from the real identity-rbac REST endpoints. */
export const useQueryRolesSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["rbac", "roles"], fetchRoles)
    return {
        roles: data?.roles ?? [],
        permissionGroups: data?.permissionGroups ?? [],
        grants: data?.grants,
        isLoading,
        error,
        mutate,
    }
}
