"use client"

import React from "react"
import { cn } from "@heroui/react"
import { SealCheckIcon } from "@phosphor-icons/react"
import { InfoTooltip } from "@/components/blocks/feedback/InfoTooltip"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link VerifiedBadge}. */
export interface VerifiedBadgeProps extends WithClassNames<undefined> {
    /**
     * Human label of the role this seal certifies (e.g. "Quản trị viên"). Shown as
     * the tooltip heading AND as the icon's accessible name — the badge is never a
     * bare decoration, a screen reader always hears WHICH role it marks.
     */
    label: string
    /** Optional second line explaining what the seal means. */
    description?: string
    /**
     * Icon scale on the repo's ladder: `sm` = `size-4` (next to `body-sm` names,
     * the default), `md` = `size-5` (next to `body-md`/heading names).
     */
    size?: "sm" | "md"
}

/**
 * The verified seal shown next to a staff member's name — a filled phosphor
 * `SealCheck` in the accent colour, wrapped in the house {@link InfoTooltip} so
 * hovering says which role it certifies.
 *
 * Purely presentational: the caller decides WHO gets a badge and with what label.
 * Today the only caller is the account menu (the signed-in viewer), because the
 * GraphQL `PublicUser` type exposes no role for other people.
 *
 * @param props - {@link VerifiedBadgeProps}
 */
export const VerifiedBadge = ({
    label,
    description,
    size = "sm",
    className,
}: VerifiedBadgeProps) => {
    return (
        <InfoTooltip title={label} description={description}>
            <SealCheckIcon
                weight="fill"
                role="img"
                aria-label={label}
                focusable="false"
                className={cn(
                    "shrink-0 text-accent",
                    size === "md" ? "size-5" : "size-4",
                    className,
                )}
            />
        </InfoTooltip>
    )
}
