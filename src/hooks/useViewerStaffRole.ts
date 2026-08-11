import { useAppSelector } from "@/redux/hooks"

/**
 * Platform-wide staff roles that earn a verified badge next to a name.
 *
 * Values are the BE role codes (`identity.roles.code`) as they arrive on
 * `me.scopedGrants[].roleCode`. Scoped-only roles (CTV/LECTURER on a single
 * SUBJECT/COURSE) are deliberately NOT here: they are not platform staff.
 */
export enum StaffRole {
    /** Engine-level bypass role (`EffectivePermissions.superAdmin`). */
    SuperAdmin = "SUPER_ADMIN",
    /** Platform administrator. */
    Admin = "ADMIN",
    /** Community moderator. */
    Moderator = "MODERATOR",
}

/**
 * Precedence, strongest first — a viewer holding several staff roles is badged
 * with the strongest one. Mirrors the backend tier ladder in
 * `AdminAuthorizationFilter.resolveTier` (SUPER_ADMIN → ADMIN → …).
 */
const STAFF_ROLE_PRECEDENCE: Array<StaffRole> = [
    StaffRole.SuperAdmin,
    StaffRole.Admin,
    StaffRole.Moderator,
]

/** `StaffRole` → i18n key for its human label. */
export const STAFF_ROLE_LABEL_KEY: Record<StaffRole, string> = {
    [StaffRole.SuperAdmin]: "verifiedBadge.role.superAdmin",
    [StaffRole.Admin]: "verifiedBadge.role.admin",
    [StaffRole.Moderator]: "verifiedBadge.role.moderator",
}

/**
 * The CURRENT VIEWER's platform staff role, or `null` when they hold none.
 *
 * Reads `state.user.scopedGrants` (hydrated from `me.scopedGrants` by
 * `useQueryUserSwr`) and only counts grants at `scopeType === "GLOBAL"` — the
 * same rule the backend uses to build `EffectivePermissions.globalRoles`
 * (`UserRoleGrantRepository.globalRoleCodes`, `WHERE scope_type = 'GLOBAL'`).
 * A MODERATOR grant scoped to one SUBJECT therefore does NOT badge the viewer
 * as platform staff.
 *
 * VIEWER-ONLY: GraphQL `PublicUser` (other people) carries no role at all, so
 * this can never be reused to badge someone else's name.
 *
 * @returns The strongest staff role held, or `null`.
 */
export const useViewerStaffRole = (): StaffRole | null =>
    useAppSelector((state) => {
        const grants = state.user.scopedGrants
        return (
            STAFF_ROLE_PRECEDENCE.find((role) =>
                grants.some(
                    (grant) => grant.roleCode === role && grant.scopeType === "GLOBAL",
                ),
            ) ?? null
        )
    })
