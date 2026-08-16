"use client"

import React from "react"
import { Button, Chip, Modal, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircleIcon, LockSimpleIcon, MedalIcon, TrophyIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetBadgeCatalogSwr } from "@/hooks/swr/api/rest/queries/useGetBadgeCatalogSwr"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"
import { toEarnedDateLabel } from "../model"

/** Props for {@link BadgeCatalogModal}. */
export interface BadgeCatalogModalProps {
    isOpen: boolean
    onClose: () => void
}

/** Badge kind → icon. Falls back to the medal for any kind added later. */
const KIND_ICON: Record<string, typeof TrophyIcon> = {
    BADGE: MedalIcon,
    TITLE: MedalIcon,
    TROPHY: TrophyIcon,
}

/** Skeleton mirroring the row list (icon + two text lines + a meter). */
const CatalogSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-start gap-3 rounded-2xl border border-separator p-4">
                <Skeleton className="size-10 shrink-0 rounded-large" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton.Typography type="body-sm" width="1/3" />
                    <Skeleton.Typography type="body-xs" width="2/3" />
                    <Skeleton.ProgressBar />
                </div>
            </div>
        ))}
    </div>
)

/**
 * One catalog row: what the badge is called, HOW it is earned, whether the
 * viewer has it, and — when the badge is measurable and still locked — how far
 * along they are.
 */
const BadgeCatalogRow = ({ badge }: { badge: BadgeCatalogItem }) => {
    const t = useTranslations("profile.badgeCatalog")
    const locale = useLocale()
    const Icon = KIND_ICON[badge.kind] ?? MedalIcon
    const earnedOn = toEarnedDateLabel(badge.awardedAt, locale)
    // `counterKey === null` ⇒ the badge has no measurable counter; the contract is
    // explicit that no progress bar may be drawn for it.
    const showProgress = !badge.earned && badge.counterKey !== null && badge.threshold > 0

    return (
        <li
            className={cn(
                "flex items-start gap-3 rounded-2xl border border-separator p-4",
                !badge.earned && "opacity-70",
            )}
        >
            <div
                className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-large",
                    badge.earned ? "bg-accent/10 text-accent" : "bg-default/40 text-muted",
                )}
            >
                {badge.iconUrl ? (
                    // Plain <img>: the icon host is whatever the backend seeded, so it
                    // cannot be pinned in the next/image remote-pattern allowlist.
                    <img src={badge.iconUrl} alt="" className="size-6 object-contain" />
                ) : (
                    <Icon className="size-5" weight={badge.earned ? "fill" : "regular"} aria-hidden focusable="false" />
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start gap-2">
                    <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
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
                    {badge.description}
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

/**
 * "All badges" dialog — the WHOLE catalog from `GET /api/v1/gamification/badges`,
 * not just what the viewer earned: every badge with its human name, how to earn
 * it, and an earned/locked state (with the award date, or the progress toward
 * the threshold when the badge is measurable).
 *
 * The request is gated on `isOpen`, so a profile tab that never opens the dialog
 * pays nothing for it.
 */
export const BadgeCatalogModal = ({ isOpen, onClose }: BadgeCatalogModalProps) => {
    const t = useTranslations("profile.badgeCatalog")
    const { data, isLoading, error, mutate } = useGetBadgeCatalogSwr(isOpen)

    const items = data?.items ?? []

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-xl">
                        <Modal.Header>
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                    <TrophyIcon className="size-5" weight="fill" aria-hidden focusable="false" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <Typography type="h6" weight="bold">
                                        {t("title")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {data
                                            ? t("summary", {
                                                earned: data.earnedCount,
                                                total: data.totalCount,
                                            })
                                            : t("subtitle")}
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Header>

                        <Modal.Body className="max-h-[60vh] overflow-y-auto py-2">
                            <AsyncContent
                                isLoading={isLoading && !data}
                                skeleton={<CatalogSkeleton />}
                                error={data ? undefined : error}
                                errorContent={{
                                    title: t("error"),
                                    onRetry: () => void mutate(),
                                    retryLabel: t("retry"),
                                }}
                                isEmpty={items.length === 0}
                                emptyContent={{ title: t("empty") }}
                            >
                                <ul className="flex list-none flex-col gap-3 p-0">
                                    {items.map((badge) => (
                                        <BadgeCatalogRow key={badge.code} badge={badge} />
                                    ))}
                                </ul>
                            </AsyncContent>
                        </Modal.Body>

                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" size="sm" onPress={onClose}>
                                {t("close")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
