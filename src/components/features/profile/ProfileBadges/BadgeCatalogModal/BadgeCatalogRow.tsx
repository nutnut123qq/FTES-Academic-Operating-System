"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircleIcon, LockSimpleIcon, MedalIcon, TrophyIcon } from "@phosphor-icons/react"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"
import { toEarnedDateLabel } from "../model"

/** Badge kind → icon. Falls back to the medal for any kind added later. */
const KIND_ICON: Record<string, typeof TrophyIcon> = {
    BADGE: MedalIcon,
    TITLE: MedalIcon,
    TROPHY: TrophyIcon,
}

/** Props for {@link BadgeCatalogRow}. */
export interface BadgeCatalogRowProps {
    badge: BadgeCatalogItem
}

/**
 * One catalog row: what the badge is called, HOW it is earned, whether the
 * viewer has it, and — when the badge is measurable and still locked — how far
 * along they are.
 *
 * Earned reads in full colour; NOT earned reads GREY. The greying is applied to
 * the identity of the badge (its emblem and its name) and deliberately NOT to
 * the "how to earn it" line: that sentence is the whole point of showing a badge
 * the viewer does not have, so dimming it would hide the one thing they came for.
 * That is why there is no blanket `opacity-*` on the row.
 */
export const BadgeCatalogRow = ({ badge }: BadgeCatalogRowProps) => {
    const t = useTranslations("profile.badgeCatalog")
    const locale = useLocale()
    const Icon = KIND_ICON[badge.kind] ?? MedalIcon
    const earnedOn = toEarnedDateLabel(badge.awardedAt, locale)
    // `counterKey === null` ⇒ the badge has no measurable counter; the contract is
    // explicit that no progress bar may be drawn for it.
    const showProgress = !badge.earned && badge.counterKey !== null && badge.threshold > 0

    return (
        <li
            data-testid={`badge-row-${badge.code}`}
            data-earned={badge.earned ? "true" : "false"}
            className={cn(
                "flex items-start gap-3 rounded-2xl border p-4",
                badge.earned ? "border-separator bg-surface" : "border-dashed border-separator",
            )}
        >
            <div
                className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-large",
                    badge.earned ? "bg-accent/10 text-accent" : "bg-default/60 text-muted",
                )}
            >
                {badge.iconUrl ? (
                    // Plain <img>: the icon host is whatever the backend seeded, so it
                    // cannot be pinned in the next/image remote-pattern allowlist.
                    // `grayscale` is what makes a locked ARTWORK badge read as locked —
                    // the muted text colour above only affects the fallback glyph.
                    <img
                        src={badge.iconUrl}
                        alt=""
                        className={cn(
                            "size-6 object-contain",
                            !badge.earned && "opacity-60 grayscale",
                        )}
                    />
                ) : (
                    <Icon
                        className="size-5"
                        weight={badge.earned ? "fill" : "regular"}
                        aria-hidden
                        focusable="false"
                    />
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start gap-2">
                    <Typography
                        type="body-sm"
                        weight="medium"
                        color={badge.earned ? undefined : "muted"}
                        className="min-w-0 flex-1"
                    >
                        {badge.name}
                    </Typography>
                    <Chip
                        size="sm"
                        variant="soft"
                        color={badge.earned ? "success" : "default"}
                        className="shrink-0"
                    >
                        {badge.earned ? (
                            <CheckCircleIcon className="size-3.5" weight="fill" aria-hidden focusable="false" />
                        ) : (
                            <LockSimpleIcon className="size-3.5" aria-hidden focusable="false" />
                        )}
                        {badge.earned ? t("earned") : t("locked")}
                    </Chip>
                </div>

                <Typography type="body-xs" color="muted">
                    {/* Locked ⇒ say out loud that this sentence IS the unlock condition; the
                        dialog promises "how to earn it" and an unlabelled sentence reads as
                        flavour text. Earned ⇒ the same sentence is just what it was for. */}
                    {badge.earned ? badge.description : t("howToEarn", { how: badge.description })}
                </Typography>

                {badge.earned ? (
                    <Typography type="body-xs" color="muted">
                        {/* No date on the award row → say "earned", never print "Invalid Date". */}
                        {earnedOn ? t("earnedOn", { date: earnedOn }) : t("earnedNoDate")}
                    </Typography>
                ) : showProgress ? (
                    <ProgressMeter
                        className="mt-1"
                        value={badge.progress}
                        max={badge.threshold}
                        label={t("progress", { current: badge.progress, total: badge.threshold })}
                        aria-label={badge.name}
                    />
                ) : null}
            </div>
        </li>
    )
}
