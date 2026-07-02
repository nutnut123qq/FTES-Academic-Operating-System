"use client"

import React, { useState } from "react"
import { Button, Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ConfirmDialog } from "@/components/blocks/feedback/ConfirmDialog"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { adminService } from "@/services/admin"
import type { Report } from "@/resources/constants/admin"
import { useAdminMutation, useAdminSession, useQueryModerationLogSwr, useQueryReportsSwr } from "../hooks"
import { REPORT_TARGET_TONE } from "../map"
import { AdminPageHeader } from "../AdminPageHeader"

/** Queue skeleton: report-card shaped rows (chip line, excerpt, action row). */
const QueueSkeleton = () => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-large border border-separator p-4">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="my-1 h-3 w-3/4 rounded" />
                <Skeleton className="h-8 w-56 rounded" />
            </div>
        ))}
    </div>
)

/**
 * `/admin/moderation` — the system-wide report queue (posts / comments /
 * resources) plus the moderation audit log. Approve/reject resolve a report
 * directly; remove passes through a {@link ConfirmDialog} first. Every
 * resolution drops the report from the pending queue and appends a log entry
 * (mock service).
 */
export const ModerationQueue = () => {
    const t = useTranslations()
    const locale = useLocale()
    const { role } = useAdminSession()
    const reportsSwr = useQueryReportsSwr()
    const logSwr = useQueryModerationLogSwr()
    const { run, isPending } = useAdminMutation()
    // report awaiting the remove confirmation (approve/reject act immediately)
    const [removing, setRemoving] = useState<Report | null>(null)

    const pendingReports = (reportsSwr.data ?? []).filter((report) => report.status === "pending")
    const formatTime = (iso: string) => new Date(iso).toLocaleString(locale)
    // the log actor is the mocked operator (their role label — the mock session has no name)
    const actor = t(`admin.roles.${role ?? "moderator"}`)

    /** Resolves a report with the given action against the mock service. */
    const moderate = async (report: Report, action: "approve" | "reject" | "remove") => {
        const successByAction = {
            approve: t("admin.moderation.toast.approved"),
            reject: t("admin.moderation.toast.rejected"),
            remove: t("admin.moderation.toast.removed"),
        } as const
        await run(() => adminService.moderateReport(report.id, action, actor), {
            successMessage: successByAction[action],
            errorMessage: t("admin.moderation.toast.failed"),
            revalidatePrefixes: ["ADMIN_REPORTS", "ADMIN_MODERATION_LOG", "ADMIN_STATS"],
        })
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <AdminPageHeader
                section="moderation"
                title={t("admin.moderation.title")}
                description={t("admin.moderation.description")}
            />

            {/* report queue */}
            <section className="flex flex-col gap-3" aria-label={t("admin.moderation.queueTitle")}>
                <Typography type="body" weight="medium">{t("admin.moderation.queueTitle")}</Typography>
                <AsyncContent
                    isLoading={!reportsSwr.data && !reportsSwr.error}
                    skeleton={<QueueSkeleton />}
                    error={!reportsSwr.data ? reportsSwr.error : undefined}
                    errorContent={{
                        title: t("admin.moderation.error"),
                        retryLabel: t("admin.moderation.retry"),
                        onRetry: () => { void reportsSwr.mutate() },
                    }}
                    isEmpty={pendingReports.length === 0}
                    emptyContent={{
                        icon: <CheckCircleIcon aria-hidden focusable="false" />,
                        title: t("admin.moderation.empty.title"),
                        description: t("admin.moderation.empty.description"),
                    }}
                >
                    <ul className="flex flex-col gap-2">
                        {pendingReports.map((report) => (
                            <ReportRow
                                key={report.id}
                                report={report}
                                timeLabel={formatTime(report.createdAt)}
                                isPending={isPending}
                                onApprove={() => { void moderate(report, "approve") }}
                                onReject={() => { void moderate(report, "reject") }}
                                onRemove={() => setRemoving(report)}
                            />
                        ))}
                    </ul>
                </AsyncContent>
            </section>

            {/* moderation log */}
            <section className="flex flex-col gap-3" aria-label={t("admin.moderation.logTitle")}>
                <Typography type="body" weight="medium">{t("admin.moderation.logTitle")}</Typography>
                <AsyncContent
                    isLoading={!logSwr.data && !logSwr.error}
                    skeleton={
                        <div className="flex flex-col gap-2 rounded-large border border-separator p-4">
                            <Skeleton className="my-1 h-3 w-2/3 rounded" />
                            <Skeleton className="my-1 h-3 w-1/2 rounded" />
                        </div>
                    }
                    error={!logSwr.data ? logSwr.error : undefined}
                    errorContent={{
                        title: t("admin.moderation.error"),
                        retryLabel: t("admin.moderation.retry"),
                        onRetry: () => { void logSwr.mutate() },
                    }}
                    isEmpty={(logSwr.data ?? []).length === 0}
                    emptyContent={{ title: t("admin.moderation.logEmpty") }}
                >
                    <ul className="flex flex-col divide-y divide-separator rounded-large border border-separator px-4">
                        {(logSwr.data ?? []).map((entry) => (
                            <li key={entry.id} className="flex flex-wrap items-center gap-2 py-3">
                                <Typography type="body-sm" weight="medium">{entry.by}</Typography>
                                <Typography type="body-sm" color="muted">
                                    {t(`admin.moderation.logEntry.${entry.action}`)}
                                </Typography>
                                <StatusChip tone={REPORT_TARGET_TONE[entry.target]}>
                                    {t(`admin.moderation.target.${entry.target}`)}
                                </StatusChip>
                                <Typography type="body-xs" color="muted" className="ml-auto">
                                    {formatTime(entry.at)}
                                </Typography>
                            </li>
                        ))}
                    </ul>
                </AsyncContent>
            </section>

            <ConfirmDialog
                isOpen={removing !== null}
                onOpenChange={(open) => { if (!open) setRemoving(null) }}
                title={t("admin.moderation.confirmRemove.title")}
                description={t("admin.moderation.confirmRemove.description")}
                confirmLabel={t("admin.confirm.confirm")}
                cancelLabel={t("admin.confirm.cancel")}
                isDestructive
                isPending={isPending}
                onConfirm={() => {
                    if (!removing) return
                    void moderate(removing, "remove").then(() => setRemoving(null))
                }}
            />
        </div>
    )
}

/** Props for {@link ReportRow}. */
interface ReportRowProps {
    report: Report
    /** Localized filed-at timestamp. */
    timeLabel: string
    /** Disables the action buttons while any moderation runs. */
    isPending: boolean
    onApprove: () => void
    onReject: () => void
    onRemove: () => void
}

/** One pending report: target chip + reason, reporter + time, excerpt, actions. */
const ReportRow = ({ report, timeLabel, isPending, onApprove, onReject, onRemove }: ReportRowProps) => {
    const t = useTranslations()
    return (
        <li className="flex flex-col gap-2 rounded-large border border-separator p-4">
            <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone={REPORT_TARGET_TONE[report.target]}>
                    {t(`admin.moderation.target.${report.target}`)}
                </StatusChip>
                <Typography type="body-sm" weight="medium">
                    {t(`admin.moderation.reason.${report.reason}`)}
                </Typography>
                <Typography type="body-xs" color="muted" className="ml-auto">
                    {t("admin.moderation.reportedBy", { name: report.reportedBy })} · {timeLabel}
                </Typography>
            </div>
            <Typography type="body-sm" color="muted" className="line-clamp-2">
                {report.excerpt}
            </Typography>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" isDisabled={isPending} onPress={onApprove}>
                    {t("admin.moderation.actions.approve")}
                </Button>
                <Button size="sm" variant="tertiary" isDisabled={isPending} onPress={onReject}>
                    {t("admin.moderation.actions.reject")}
                </Button>
                <Button size="sm" variant="danger" isDisabled={isPending} onPress={onRemove}>
                    {t("admin.moderation.actions.remove")}
                </Button>
            </div>
        </li>
    )
}
