"use client"

import React from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useHasPermission } from "@/hooks/useHasPermission"
import { useQueryReportsSwr } from "../hooks/useQueryReportsSwr"
import { useMutateModerationDecisionSwr } from "../hooks/useMutateModerationDecisionSwr"

/** Loading skeleton — mirrors the reported-item rows so the layout never jumps. */
const ModerationSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
            <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
            >
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-48 rounded-full" />
                    <Skeleton className="h-3 w-64 rounded-full" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * Community moderation queue (§6). Wired to the real BE
 * `GET /community/moderation/queue` (list) + `POST
 * /community/moderation/queue/{id}/decision` (keep = APPROVE / remove = REMOVE).
 *
 * The queue requires the `community.moderate` permission: without it the fetch
 * is gated off (no 403 spam) and the empty state is shown. Decisions
 * optimistically drop the row and roll back on failure.
 */
export const CommunityModeration = () => {
    const t = useTranslations("communityHub")
    const canModerate = useHasPermission("community.moderate")
    const { reports, isLoading, error, mutate } = useQueryReportsSwr(canModerate)
    const decide = useMutateModerationDecisionSwr()

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h5" weight="bold">
                {t("moderation.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && reports.length === 0}
                skeleton={<ModerationSkeleton />}
                isEmpty={reports.length === 0}
                emptyContent={{
                    title: canModerate ? t("moderation.empty") : t("moderation.restricted"),
                }}
                error={reports.length === 0 ? error : undefined}
                errorContent={{
                    title: t("moderation.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Typography type="body-sm" weight="medium">
                                        {t("moderation.targetLabel", { type: report.targetType })}
                                    </Typography>
                                    {typeof report.priority === "number" ? (
                                        <Chip size="sm" variant="soft" color="warning">
                                            {t("moderation.priority", { priority: report.priority })}
                                        </Chip>
                                    ) : null}
                                </div>
                                <Typography type="body-xs" color="muted" truncate>
                                    {report.targetId}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("moderation.source", { source: report.source })}
                                </Typography>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onPress={() => void decide(report.id, "APPROVE")}
                                >
                                    {t("moderation.keep")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onPress={() => void decide(report.id, "REMOVE")}
                                >
                                    {t("moderation.remove")}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
