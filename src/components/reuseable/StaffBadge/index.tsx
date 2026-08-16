"use client"

import React from "react"
import { cn } from "@heroui/react"
import { SealCheckIcon, ShieldCheckIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { InfoTooltip } from "@/components/blocks/feedback/InfoTooltip"
import { staffBadgeFor } from "@/hooks/useViewerStaffRole"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link StaffBadge}. */
export interface StaffBadgeProps extends WithClassNames<undefined> {
    /**
     * The person's BE role code — `PublicUser.staffRole` / `UserCard.staffRole` off a
     * feed, comment or member row, or the viewer's own role from
     * {@link import("@/hooks/useViewerStaffRole").useViewerStaffRole}.
     *
     * `null` / `undefined` / an unrecognized code renders NOTHING AT ALL (no spacer, no
     * empty tooltip): ordinary members are the overwhelming majority, so the badge-less
     * markup must stay exactly as it was.
     */
    role?: string | null
    /**
     * Icon scale on the repo's ladder: `sm` = `size-4` (next to `body-sm` names, the
     * default), `md` = `size-5` (next to a `h4`/`body-md` profile heading).
     */
    size?: "sm" | "md"
}

/**
 * The staff mark shown next to a person's name — THE one component every identity
 * surface uses, so the profile hero, the community feed, a comment and the account
 * menu can never disagree about the same account.
 *
 * It owns no rule of its own: which role earns which mark lives in
 * {@link import("@/hooks/useViewerStaffRole").staffBadgeFor}. Today that rule draws a
 * filled `SealCheck` for an admin or a mentor and a filled `ShieldCheck` for a
 * moderator.
 *
 * A11y: the icon is `role="img"` with the ROLE NAME as its accessible name, so a
 * screen reader announces "Quản trị viên" (not an unnamed graphic) — the tooltip is
 * hover-only sugar on top and is never the only carrier of the meaning.
 *
 * @param props - {@link StaffBadgeProps}
 */
export const StaffBadge = ({ role, size = "sm", className }: StaffBadgeProps) => {
    const t = useTranslations()
    const badge = staffBadgeFor(role)
    if (!badge) return null

    const Icon = badge.kind === "shield" ? ShieldCheckIcon : SealCheckIcon
    const label = t(badge.labelKey)

    return (
        <InfoTooltip title={label} description={t(badge.descriptionKey)}>
            <Icon
                weight="fill"
                role="img"
                aria-label={label}
                focusable="false"
                className={cn(
                    "shrink-0",
                    badge.kind === "shield" ? "text-success" : "text-accent",
                    size === "md" ? "size-5" : "size-4",
                    className,
                )}
            />
        </InfoTooltip>
    )
}
