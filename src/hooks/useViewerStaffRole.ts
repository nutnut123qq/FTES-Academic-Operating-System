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
 * Coerce a role code sent by the backend into a {@link StaffRole} — the rule for
 * badging SOMEONE ELSE, matching the one the viewer badge uses above.
 *
 * GraphQL types `PublicUser.staffRole` as a plain `String`, and the backend already
 * collapses multiple grants to the strongest code with the SAME ladder as
 * {@link STAFF_ROLE_PRECEDENCE} (`PermissionEvaluationService.staffRank`), so there is
 * nothing left to rank here — only to recognize. An unknown / future code degrades to
 * `null` (no badge) rather than being rendered raw next to a person's name.
 *
 * @param roleCode - `me.scopedGrants[].roleCode` or `PublicUser.staffRole`; nullable.
 * @returns The matching staff role, or `null` when the code is absent or unknown.
 */
export const parseStaffRole = (roleCode?: string | null): StaffRole | null =>
    STAFF_ROLE_PRECEDENCE.find((role) => role === roleCode) ?? null

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
 * VIEWER-ONLY: it reads the redux session. To badge SOMEONE ELSE, run their
 * `PublicUser.staffRole` through {@link parseStaffRole} instead — same ladder, so
 * the viewer's own badge and the one others see on them never disagree.
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
