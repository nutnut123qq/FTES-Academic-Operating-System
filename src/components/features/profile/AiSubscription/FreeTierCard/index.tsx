"use client"

import { SealCheckIcon } from "@phosphor-icons/react"
import React from "react"
import {
    cn,
    Button,
    Card,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import { TierLevelIcon } from "@/components/svg/TierLevelIcon"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Free-tier base credit allowance — mirrors the backend free auto quota default
 * (`systemConfig.ai.auto`, base 50 / 5h · 500 / week). Shown so the free card
 * states its credits like the paid tiers.
 */
const FREE_CREDITS_PER_5H = 50
const FREE_CREDITS_PER_WEEK = 500

/** Props for {@link FreeTierCard}. */
export interface FreeTierCardProps extends WithClassNames<undefined> {
    /** True when the user is currently on the free tier (no paid subscription). */
    isCurrent: boolean
}

/**
 * Static free-tier card (not purchasable).
 *
 * Presentational: shows the "current plan" chip when active, otherwise a
 * disabled CTA. No business logic.
 * @param props - whether the free tier is the user's current plan
 */
export const FreeTierCard = ({
    isCurrent,
    className,
}: FreeTierCardProps) => {
    const t = useTranslations()
    return (
        <Card className={cn("flex h-full flex-col", className)}>
            <Card.Content className="flex flex-1 flex-col gap-3">
                {/* icon + tier name — tight pair */}
                <div className="flex items-center gap-2">
                    <TierLevelIcon
                        level={1}
                        className="size-6 shrink-0 text-accent"
                    />
                    <Typography type="h5" weight="semibold">
                        {t("aiSubscription.free.title")}
                    </Typography>
                </div>
                <div className="h-[2lh]">
                    <Typography type="body-sm" color="muted" className="line-clamp-3">
                        {t("aiSubscription.free.desc")}
                    </Typography>
                </div>
                <div className="flex flex-col gap-2">
                    <Typography type="h3" weight="bold">
                        {t("aiSubscription.free.price")}
                    </Typography>
                    {/* spacer — matches paid tiers' USD hint block so CTAs align */}
                    <div
                        className="h-[3lh]"
                        aria-hidden
                    />
                </div>
                {isCurrent ? (
                    <div className="flex w-full items-center justify-center rounded-3xl bg-success/10 px-3 py-2">
                        <Typography type="body-sm" weight="medium" className="text-success">
                            {t("aiSubscription.currentPlan")}
                        </Typography>
                    </div>
                ) : (
                    <Button
                        variant="secondary"
                        isDisabled
                        fullWidth
                    >
                        {t("aiSubscription.free.cta")}
                    </Button>
                )}
            </Card.Content>
            <Card.Footer>
                {/* free base credits — stated like the paid tiers' credit list */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <SealCheckIcon
                            aria-hidden
                            className="size-5 shrink-0 text-muted"
                        />
                        <Typography type="body-sm" color="muted">
                            {t("aiSubscription.creditsPer5h", { credits: FREE_CREDITS_PER_5H })}
                        </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                        <SealCheckIcon
                            aria-hidden
                            className="size-5 shrink-0 text-muted"
                        />
                        <Typography type="body-sm" color="muted">
                            {t("aiSubscription.creditsPerWeek", { credits: FREE_CREDITS_PER_WEEK })}
                        </Typography>
                    </div>
                </div>
            </Card.Footer>
        </Card>
    )
}
