"use client"

import useSWR from "swr"

/** A system role in the RBAC model (§1 Authorization). */
export interface Role {
    id: string
    /** Stable key; i18n label lives at `rbac.roles.<key>`. */
    key: "member" | "moderator" | "admin" | "superAdmin"
    memberCount: number
}

/** A permission that a role may grant. Label at `rbac.permissions.<key>`. */
export interface Permission {
    id: string
    key: "manageUsers" | "manageContent" | "moderate" | "viewAnalytics" | "manageRoles" | "publish"
}

/** Shape returned by the hook: the role list, the permission list, and the grant matrix. */
export interface RolesData {
    roles: Array<Role>
    permissions: Array<Permission>
    /** Per role key → set of granted permission keys. */
    grants: Record<Role["key"], Set<Permission["key"]>>
}

// ponytail: mock BE — no RBAC endpoint yet. Deterministic roles + a hand-authored
// grant matrix (least-privilege member → full superAdmin). Wire a real GraphQL query
// (roles { key memberCount permissions }) when the contract lands; hook API stays.
const fetchRolesMock = async (): Promise<RolesData> => ({
    roles: [
        { id: "role-member", key: "member", memberCount: 12480 },
        { id: "role-moderator", key: "moderator", memberCount: 86 },
        { id: "role-admin", key: "admin", memberCount: 12 },
        { id: "role-super-admin", key: "superAdmin", memberCount: 3 },
    ],
    permissions: [
        { id: "perm-manage-users", key: "manageUsers" },
        { id: "perm-manage-content", key: "manageContent" },
        { id: "perm-moderate", key: "moderate" },
        { id: "perm-view-analytics", key: "viewAnalytics" },
        { id: "perm-manage-roles", key: "manageRoles" },
        { id: "perm-publish", key: "publish" },
    ],
    grants: {
        member: new Set([]),
        moderator: new Set(["moderate", "publish"]),
        admin: new Set(["manageUsers", "manageContent", "moderate", "viewAnalytics", "publish"]),
        superAdmin: new Set([
            "manageUsers",
            "manageContent",
            "moderate",
            "viewAnalytics",
            "manageRoles",
            "publish",
        ]),
    },
})

/** Loads the RBAC roles + permission matrix. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryRolesSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["rbac", "roles"], () => fetchRolesMock())
    return {
        roles: data?.roles ?? [],
        permissions: data?.permissions ?? [],
        grants: data?.grants,
        isLoading,
        error,
        mutate,
    }
}
