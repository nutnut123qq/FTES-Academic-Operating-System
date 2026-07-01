"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    Icon,
} from "@iconify/react"
import {
    BadgeImage,
} from "../BadgeImage"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Weekly-league tiers, lowest → highest. Mirrors the backend `LeagueTier` enum.
 * Names are picked so each maps to a *distinct, multicolor* `fluent-emoji-flat`
 * icon (medals → medal → gem → trophy → crown), escalating prestige.
 */
export enum LeagueTier {
    /** Entry tier. */
    Bronze = "bronze",
    /** Second tier. */
    Silver = "silver",
    /** Third tier. */
    Gold = "gold",
    /** Fourth tier. */
    Platinum = "platinum",
    /** Fifth tier. */
    Diamond = "diamond",
    /** Sixth tier. */
    Champion = "champion",
    /** Top tier. */
    Legend = "legend",
}

/**
 * Per-tier `fluent-emoji-flat` icon name (multicolor, no recolor needed) +
 * display label. The Iconify set ships gold/silver/bronze medals natively, so the
 * tier ladder reads as real metal/gem/crown art instead of one recolored shape.
 */
interface TierVisual {
    /** Iconify icon id (`fluent-emoji-flat:*`). */
    icon: string
    /** Human label shown next to the badge. */
    label: string
}

/** Tier → icon + label map. */
const TIER_VISUAL: Record<LeagueTier, TierVisual> = {
    [LeagueTier.Bronze]: {
        icon: "fluent-emoji-flat:3rd-place-medal",
        label: "Bronze",
    },
    [LeagueTier.Silver]: {
        icon: "fluent-emoji-flat:2nd-place-medal",
        label: "Silver",
    },
    [LeagueTier.Gold]: {
        icon: "fluent-emoji-flat:1st-place-medal",
        label: "Gold",
    },
    [LeagueTier.Platinum]: {
        icon: "fluent-emoji-flat:sports-medal",
        label: "Platinum",
    },
    [LeagueTier.Diamond]: {
        icon: "fluent-emoji-flat:gem-stone",
        label: "Diamond",
    },
    [LeagueTier.Champion]: {
        icon: "fluent-emoji-flat:trophy",
        label: "Champion",
    },
    [LeagueTier.Legend]: {
        icon: "fluent-emoji-flat:crown",
        label: "Legend",
    },
}

/** Props for {@link LeagueTierBadge}. */
export interface LeagueTierBadgeProps extends WithClassNames<undefined> {
    /** Which tier to render. */
    tier: LeagueTier
    /** Icon size in px (default 24). */
    size?: number
    /** Show the tier name next to the icon. */
    showLabel?: boolean
}

/**
 * Renders a weekly-league tier as its multicolor `fluent-emoji-flat` badge,
 * optionally with the tier name. Pure presentational — drives off {@link LeagueTier}.
 * @param props - {@link LeagueTierBadgeProps}
 */
export const LeagueTierBadge = ({
    tier,
    size = 24,
    showLabel = false,
    className,
}: LeagueTierBadgeProps) => {
    // resolve the icon + label for this tier
    const visual = TIER_VISUAL[tier]
    return (
        <div className={cn("shrink-0", className)}>
            <div className="flex items-center gap-1.5">
                {/* real art from MinIO (badges/league/<tier>.png) once uploaded; until
                then fall back to the multicolor fluent-emoji placeholder */}
                <BadgeImage
                    objectKey={`badges/league/${tier}.png`}
                    size={size}
                    alt={visual.label}
                    fallback={(
                        <Icon
                            icon={visual.icon}
                            width={size}
                            height={size}
                            aria-label={visual.label}
                        />
                    )}
                />
                {showLabel ? (
                    <span className="text-sm font-medium text-foreground">
                        {visual.label}
                    </span>
                ) : null}
            </div>
        </div>
    )
}
