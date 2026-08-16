import { useAppSelector } from "@/redux/hooks"

/**
 * Platform-wide staff roles that earn a badge next to a name.
 *
 * Values are the BE role codes (`identity.roles.code`) as they arrive on
 * `me.scopedGrants[].roleCode`. Roles that only ever exist scoped to ONE
 * SUBJECT/COURSE/GROUP (CTV) are deliberately NOT here: they are not platform staff.
 */
export enum StaffRole {
    /** Engine-level bypass role (`EffectivePermissions.superAdmin`). */
    SuperAdmin = "SUPER_ADMIN",
    /** Platform administrator. */
    Admin = "ADMIN",
    /**
     * The MENTOR tier the product asks for. There is no `MENTOR` role in the backend
     * catalog: `V4__identity_rbac_seed.sql` seeds `LECTURER` ("Giảng viên", *map legacy
     * INSTRUCTOR*) with `allowed_scope_types` including `GLOBAL`, and that is the only
     * teaching role that can be held platform-wide — so LECTURER-at-GLOBAL *is* how the
     * system represents a mentor today. The label key below says "mentor"; the wire code
     * stays `LECTURER` because that is what identity actually grants.
     */
    Mentor = "LECTURER",
    /** Community moderator. */
    Moderator = "MODERATOR",
}

/**
 * Precedence, strongest first — a viewer holding several staff roles is badged
 * with the strongest one. The first three mirror the backend tier ladder
 * (`AdminAuthorizationFilter.resolveTier` / `PermissionEvaluationService.staffRank`:
 * SUPER_ADMIN → ADMIN → MODERATOR). `LECTURER` is appended LAST rather than slotted
 * into the middle because the backend ladder does not rank it at all — inventing a
 * rank here would make the viewer's own badge disagree with the one the backend
 * collapses for everyone else.
 */
const STAFF_ROLE_PRECEDENCE: Array<StaffRole> = [
    StaffRole.SuperAdmin,
    StaffRole.Admin,
    StaffRole.Moderator,
    StaffRole.Mentor,
]

/** `StaffRole` → i18n key for its human label. */
export const STAFF_ROLE_LABEL_KEY: Record<StaffRole, string> = {
    [StaffRole.SuperAdmin]: "verifiedBadge.role.superAdmin",
    [StaffRole.Admin]: "verifiedBadge.role.admin",
    [StaffRole.Mentor]: "verifiedBadge.role.mentor",
    [StaffRole.Moderator]: "verifiedBadge.role.moderator",
}

/**
 * Which mark a staff role wears. Product decision (owner, 2026-08-16): admins and
 * mentors both carry the VERIFIED SEAL; a moderator carries a SHIELD instead, so the
 * seal keeps meaning "this account speaks for FTES" and the shield means "this account
 * polices the community".
 */
export type StaffBadgeKind = "verified" | "shield"

/** Everything a badge renderer needs about one staff role. */
export interface StaffBadgeSpec {
    /** The recognized role, for callers that branch on it (tests, analytics). */
    role: StaffRole
    /** Seal or shield. */
    kind: StaffBadgeKind
    /** i18n key of the role's human label — also the badge's accessible name. */
    labelKey: string
    /** i18n key of the one-line explanation shown under the label in the tooltip. */
    descriptionKey: string
}

/** `StaffRole` → its mark. The ONLY place the three-tier rule is written down. */
const STAFF_BADGE_KIND: Record<StaffRole, StaffBadgeKind> = {
    [StaffRole.SuperAdmin]: "verified",
    [StaffRole.Admin]: "verified",
    [StaffRole.Mentor]: "verified",
    [StaffRole.Moderator]: "shield",
}

/** Per-kind tooltip body — the seal and the shield certify different things. */
const STAFF_BADGE_DESCRIPTION_KEY: Record<StaffBadgeKind, string> = {
    verified: "verifiedBadge.description",
    shield: "verifiedBadge.moderatorDescription",
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
 * THE role → badge rule. Every surface that shows a person's identity calls this (via
 * {@link import("@/components/reuseable/StaffBadge").StaffBadge}) instead of re-deciding
 * locally, so the profile page, the feed, a comment and the account menu can never
 * disagree about the same account.
 *
 * @param roleCode - a BE role code (`PublicUser.staffRole`, `UserCard.staffRole`,
 *   `me.scopedGrants[].roleCode`) or a {@link StaffRole}; nullable.
 * @returns the badge to draw, or `null` for an ordinary member AND for any code this
 *   build does not recognize — an unknown / future / misspelled role must degrade to
 *   NO badge rather than to a raw string next to someone's name.
 */
export const staffBadgeFor = (roleCode?: string | null): StaffBadgeSpec | null => {
    const role = parseStaffRole(roleCode)
    if (!role) return null
    const kind = STAFF_BADGE_KIND[role]
    return {
        role,
        kind,
        labelKey: STAFF_ROLE_LABEL_KEY[role],
        descriptionKey: STAFF_BADGE_DESCRIPTION_KEY[kind],
    }
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
