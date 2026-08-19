"use client"

import React from "react"
import { Tooltip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react"
import { badgeKindIcon } from "@/components/features/gamification/badgeIcon"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"

/** Props for {@link BadgeCatalogCell}. */
export interface BadgeCatalogCellProps {
    badge: BadgeCatalogItem
    /** Open the detail (name + how-to-earn + progress) for this badge. */
    onSelect: (badge: BadgeCatalogItem) => void
}

/**
 * One SQUARE tile in the achievement wall — just the emblem, read in full colour
 * when earned and GREY when locked. Hover reveals the name (a {@link Tooltip}); a
 * click opens the detail where the "how to earn it" line and the progress live, so
 * a wall of 40 badges stays a compact grid instead of a long scroll.
 *
 * The tile is the tooltip's single focusable child, so it is BOTH the hover target
 * and the click target — no extra wrapper, no nested buttons. A corner marker
 * (check / lock) states earned-vs-locked without needing the tooltip open, and the
 * `aria-label` carries the name for anyone who never sees the hover card.
 */
export const BadgeCatalogCell = ({ badge, onSelect }: BadgeCatalogCellProps) => {
    const Icon = badgeKindIcon(badge.kind)

    return (
        <Tooltip delay={200}>
            <Tooltip.Trigger>
                <button
                    type="button"
                    onClick={() => onSelect(badge)}
                    aria-label={badge.name}
                    data-testid={`badge-cell-${badge.code}`}
                    data-earned={badge.earned ? "true" : "false"}
                    className={cn(
                        "group relative flex aspect-square items-center justify-center rounded-2xl border p-3 transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        badge.earned
                            ? "border-separator bg-surface hover:bg-default"
                            : "border-dashed border-separator hover:bg-default/60",
                    )}
                >
                    {badge.iconUrl ? (
                        // Plain <img>: the icon host is backend-seeded, so it can't be
                        // pinned in the next/image allowlist. `grayscale` is what makes a
                        // locked ARTWORK badge read as locked.
                        <img
                            src={badge.iconUrl}
                            alt=""
                            className={cn(
                                "size-full object-contain transition group-hover:scale-105",
                                !badge.earned && "opacity-50 grayscale",
                            )}
                        />
                    ) : (
                        <Icon
                            className={cn("size-2/3", badge.earned ? "text-accent" : "text-muted")}
                            weight={badge.earned ? "fill" : "regular"}
                            aria-hidden
                            focusable="false"
                        />
                    )}

                    {/* corner state marker — visible without opening the tooltip */}
                    <span
                        className={cn(
                            "absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full shadow",
                            badge.earned ? "bg-success text-white" : "bg-default text-muted",
                        )}
                    >
                        {badge.earned ? (
                            <CheckCircleIcon className="size-3.5" weight="fill" aria-hidden focusable="false" />
                        ) : (
                            <LockSimpleIcon className="size-3" aria-hidden focusable="false" />
                        )}
                    </span>
                </button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top" className="max-w-[220px]">
                <Tooltip.Arrow />
                <Typography type="body-xs" weight="medium">
                    {badge.name}
                </Typography>
            </Tooltip.Content>
        </Tooltip>
    )
}
