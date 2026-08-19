"use client"

import React from "react"
import { Button, Chip, Modal, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircleIcon, LockSimpleIcon, MedalIcon, TrophyIcon } from "@phosphor-icons/react"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"
import { toEarnedDateLabel } from "../model"

/** Badge kind → fallback glyph when the badge has no seeded artwork. */
const KIND_ICON: Record<string, typeof TrophyIcon> = {
    BADGE: MedalIcon,
    TITLE: MedalIcon,
    TROPHY: TrophyIcon,
}

/** Props for {@link BadgeDetailModal}. */
export interface BadgeDetailModalProps {
    /** The badge to detail; `null` closes the dialog. */
    badge: BadgeCatalogItem | null
    onClose: () => void
}

/**
 * Detail for ONE badge, opened by clicking a tile in the grid: the emblem large,
 * the name, an earned/locked chip, the "how to earn it" line, and — when the badge
 * is measurable and still locked — the progress bar toward its threshold. Earned
 * badges show the award date instead.
 *
 * This is the second half of the grid's "hover for the name, click for the goal +
 * progress" model: the wall stays compact, and everything the old long row carried
 * lives here, one badge at a time.
 */
export const BadgeDetailModal = ({ badge, onClose }: BadgeDetailModalProps) => {
    const t = useTranslations("profile.badgeCatalog")
    const locale = useLocale()

    // `null` badge still renders the Modal shell (closed) so open/close animates.
    const Icon = badge ? KIND_ICON[badge.kind] ?? MedalIcon : MedalIcon
    const earnedOn = badge ? toEarnedDateLabel(badge.awardedAt, locale) : null
    const showProgress =
        badge != null && !badge.earned && badge.counterKey !== null && badge.threshold > 0

    return (
        <Modal
            isOpen={badge !== null}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-sm">
                        <Modal.CloseTrigger />
                        {badge ? (
                            <Modal.Body className="flex flex-col items-center gap-3 py-8 text-center">
                                <div
                                    className={cn(
                                        "flex size-24 items-center justify-center rounded-3xl",
                                        badge.earned ? "bg-accent/10" : "bg-default/60",
                                    )}
                                >
                                    {badge.iconUrl ? (
                                        // Plain <img>: backend-seeded icon host, not in the
                                        // next/image allowlist; grayscale marks a locked badge.
                                        <img
                                            src={badge.iconUrl}
                                            alt=""
                                            className={cn(
                                                "size-16 object-contain",
                                                !badge.earned && "opacity-60 grayscale",
                                            )}
                                        />
                                    ) : (
                                        <Icon
                                            className={cn(
                                                "size-12",
                                                badge.earned ? "text-accent" : "text-muted",
                                            )}
                                            weight={badge.earned ? "fill" : "regular"}
                                            aria-hidden
                                            focusable="false"
                                        />
                                    )}
                                </div>

                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color={badge.earned ? "success" : "default"}
                                >
                                    {badge.earned ? (
                                        <CheckCircleIcon className="size-3.5" weight="fill" aria-hidden focusable="false" />
                                    ) : (
                                        <LockSimpleIcon className="size-3.5" aria-hidden focusable="false" />
                                    )}
                                    {badge.earned ? t("earned") : t("locked")}
                                </Chip>

                                <Typography type="h5" weight="bold">
                                    {badge.name}
                                </Typography>

                                <Typography type="body-sm" color="muted">
                                    {badge.earned
                                        ? badge.description
                                        : t("howToEarn", { how: badge.description })}
                                </Typography>

                                {badge.earned ? (
                                    <Typography type="body-xs" color="muted">
                                        {earnedOn ? t("earnedOn", { date: earnedOn }) : t("earnedNoDate")}
                                    </Typography>
                                ) : showProgress ? (
                                    <ProgressMeter
                                        className="mt-1 w-full"
                                        value={badge.progress}
                                        max={badge.threshold}
                                        label={t("progress", {
                                            current: badge.progress,
                                            total: badge.threshold,
                                        })}
                                        aria-label={badge.name}
                                    />
                                ) : null}

                                <Button variant="primary" onPress={onClose} className="mt-2">
                                    {t("close")}
                                </Button>
                            </Modal.Body>
                        ) : null}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
