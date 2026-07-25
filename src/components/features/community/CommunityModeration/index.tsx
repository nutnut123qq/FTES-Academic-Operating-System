"use client"

import React from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Link } from "@/i18n/navigation"
import { useHasPermission } from "@/hooks/useHasPermission"
import { useQueryReportsSwr } from "../hooks/useQueryReportsSwr"
import { useMutateModerationDecisionSwr } from "../hooks/useMutateModerationDecisionSwr"
import {
    useEscalatedReports,
    useMutateEscalateReportSwr,
} from "../hooks/useMutateEscalateReportSwr"

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
 *
 * A POST target's id links to the reported post itself (new tab) so the moderator
 * never decides blind.
 *
 * Escalation (`POST /community/reports/{reportId}/escalate`) addresses the REPORT, not
 * the queue row, so the action is offered ONLY on rows whose `reportId` came back non-null
 * — a row raised by AI/the system has no report to escalate and passing the queue-row id
 * there would 404. Escalating does NOT resolve the queue row (the BE only moves the report
 * to `IN_REVIEW`), so the row stays here for its keep/remove decision and only swaps the
 * button for an "đã chuyển cấp" chip — pressing it again could only ever 409.
 */
export const CommunityModeration = () => {
    const t = useTranslations("communityHub")
    const canModerate = useHasPermission("community.moderate")
    const { reports, isLoading, error, mutate } = useQueryReportsSwr(canModerate)
    const decide = useMutateModerationDecisionSwr()
    const escalate = useMutateEscalateReportSwr()
    const isEscalated = useEscalatedReports()

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
                                {/* a POST target opens in a NEW TAB: the moderator keeps
                                    the queue (and its optimistic state) mounted while
                                    reviewing the reported content */}
                                {report.targetType === "POST" ? (
                                    <Link
                                        href={`/community/${report.targetId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex max-w-full items-center gap-1 text-accent hover:underline"
                                        aria-label={t("moderation.openTarget")}
                                    >
                                        <Typography type="body-xs" truncate className="text-accent">
                                            {report.targetId}
                                        </Typography>
                                        <ArrowSquareOutIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-3.5 shrink-0"
                                        />
                                    </Link>
                                ) : (
                                    <Typography type="body-xs" color="muted" truncate>
                                        {report.targetId}
                                    </Typography>
                                )}
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
                                {report.reportId && !isEscalated(report.reportId) ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onPress={() => void escalate(report.reportId as string)}
                                    >
                                        {t("moderation.escalate")}
                                    </Button>
                                ) : null}
                                {isEscalated(report.reportId) ? (
                                    <Chip size="sm" variant="soft" color="accent">
                                        {t("moderation.escalatedTag")}
                                    </Chip>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
