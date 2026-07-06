"use client"

import React from "react"
import { Card, CardContent, Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FireIcon, SparkleIcon, CoinsIcon } from "@phosphor-icons/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryOverviewIdentitySwr } from "../../hooks/useQueryOverviewIdentitySwr"

/** Props for {@link IdentityCard}. */
export type IdentityCardProps = WithClassNames<undefined>

/**
 * Dashboard LEFT identity card — the viewer's avatar + name over a compact
 * standing row (current streak · reward points) and an AI-credit meter (e.g.
 * 250/250). Self-fetches its own mock leaf query through {@link AsyncContent}.
 * @param props - optional root class name (placement only)
 */
export const IdentityCard = ({ className }: IdentityCardProps) => {
    const t = useTranslations("analytics")
    const { data, isLoading, error, mutate } = useQueryOverviewIdentitySwr()

    return (
        <AsyncContent
            isLoading={isLoading || !data}
            error={!data ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <Card className={cn(className)}>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Skeleton.Avatar size="lg" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <Skeleton.Typography type="body" width="1/2" />
                                <Skeleton.Typography type="body-xs" width="1/3" />
                            </div>
                        </div>
                        <Skeleton className="h-12 w-full rounded-large" />
                    </CardContent>
                </Card>
            )}
        >
            {data ? (
                <Card className={cn(className)}>
                    <CardContent className="flex flex-col gap-4">
                        {/* avatar + name */}
                        <div className="flex items-center gap-3">
                            <UserAvatar
                                username={data.username}
                                avatar={data.avatar}
                                seed={data.username}
                                size="lg"
                            />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <Typography weight="semibold" truncate>
                                    {data.name}
                                </Typography>
                                <Typography type="body-xs" color="muted" truncate>
                                    @{data.username}
                                </Typography>
                            </div>
                        </div>

                        {/* standing chips — streak · reward points */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="warning">
                                <FireIcon aria-hidden focusable="false" className="size-4" />
                                <Chip.Label>
                                    {t("overview.streakDays", { count: data.streak })}
                                </Chip.Label>
                            </Chip>
                            <Chip size="sm" variant="soft" color="success">
                                <CoinsIcon aria-hidden focusable="false" className="size-4" />
                                <Chip.Label>
                                    {t("overview.points", { count: data.rewardPoints })}
                                </Chip.Label>
                            </Chip>
                        </div>

                        {/* AI-credit meter (e.g. 250/250) */}
                        <ProgressMeter
                            value={data.aiCreditRemaining}
                            max={data.aiCreditLimit}
                            aria-label={t("overview.aiCredit")}
                            label={(
                                <span className="inline-flex items-center gap-2">
                                    <SparkleIcon aria-hidden focusable="false" className="size-4 text-accent" />
                                    {t("overview.aiCreditValue", {
                                        remaining: data.aiCreditRemaining,
                                        limit: data.aiCreditLimit,
                                    })}
                                </span>
                            )}
                        />
                    </CardContent>
                </Card>
            ) : null}
        </AsyncContent>
    )
}
