"use client"

import React from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Link } from "@/i18n/navigation"
import { useHasPermission } from "@/hooks/useHasPermission"
import { formatRelativeTime } from "../hooks/relativeTime"
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
 * No raw uuid reaches the screen: the ids stay in the React `key`, in the write calls and
 * inside the target link's href, while the card renders translated tokens (target type /
 * source / priority), "reported N ago" and the BE-resolved context — a quote of the reported
 * content, who posted it, why it was reported. The quote arrives PLAIN, already stripped of
 * markup and of every url by the BE (`ModerationExcerpt`, 200 chars): it is printed as text,
 * never re-stripped and never rendered as markdown/HTML — a moderation console must not become
 * the link-spreading surface it exists to clear. Each context line is omitted entirely when the
 * BE has nothing (deleted target, AI row with no report), never shown as an empty label.
 * A POST target additionally gets a link to the reported post (new tab); a COMMENT or USER row
 * cannot be linked (see the comment at the link site) and says so instead.
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
    const locale = useLocale()
    const canModerate = useHasPermission("community.moderate")
    const { reports, isLoading, error, mutate } = useQueryReportsSwr(canModerate)
    const decide = useMutateModerationDecisionSwr()
    const escalate = useMutateEscalateReportSwr()
    const isEscalated = useEscalatedReports()

    // Raw BE enum tokens -> reader-facing labels. The fallback is the TOKEN itself (a
    // word, never an id), so an enum value we have no translation for still reads.
    const targetTypeLabel = (type: string) =>
        t.has(`moderation.targetType.${type}`) ? t(`moderation.targetType.${type}`) : type
    const sourceLabel = (source: string) =>
        t.has(`moderation.sourceType.${source}`) ? t(`moderation.sourceType.${source}`) : source
    // BE priority is a Short: 0 = AI thinks it is clean, 1 = a user report, 2 = AI flagged
    // a violation. Compared with >= / === so an unforeseen value still lands on a level.
    const priorityLabel = (priority: number) =>
        t(
            `moderation.priorityLevel.${
                priority >= 2 ? "high" : priority === 1 ? "normal" : "low"
            }`,
        )
    // The reason is the BE `reasonCode` (SPAM / HARASSMENT / NSFW / …), followed by
    // ": <what the reporter typed>" when they typed anything. Translate the CODE and leave the
    // reporter's own words untouched; an unknown code falls back to the token, as above.
    const reasonLabel = (reason: string) => {
        const separator = reason.indexOf(":")
        const code = (separator === -1 ? reason : reason.slice(0, separator)).trim()
        const detail = separator === -1 ? "" : reason.slice(separator + 1).trim()
        const label = t.has(`moderation.reasonCode.${code}`)
            ? t(`moderation.reasonCode.${code}`)
            : code
        return detail ? `${label}: ${detail}` : label
    }

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
                    {reports.map((report) => {
                        const reportedAt = formatRelativeTime(report.createdAt, locale)
                        return (
                            <div
                                key={report.id}
                                className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Typography type="body-sm" weight="medium">
                                            {t("moderation.targetLabel", {
                                                type: targetTypeLabel(report.targetType),
                                            })}
                                        </Typography>
                                        {typeof report.priority === "number" ? (
                                            <Chip size="sm" variant="soft" color="warning">
                                                {priorityLabel(report.priority)}
                                            </Chip>
                                        ) : null}
                                    </div>
                                    {/* Plain text on purpose: the BE already removed the markup
                                        and the links, so anything more than printing it would
                                        either re-strip what is clean or resurrect what was cut. */}
                                    {report.targetExcerpt ? (
                                        <Typography type="body-sm" className="line-clamp-3">
                                            {report.targetExcerpt}
                                        </Typography>
                                    ) : null}
                                    {report.targetAuthorName ? (
                                        <Typography type="body-xs" color="muted">
                                            {t("moderation.author", {
                                                name: report.targetAuthorName,
                                            })}
                                        </Typography>
                                    ) : null}
                                    {report.reportReason ? (
                                        <Typography type="body-xs" color="muted">
                                            {t("moderation.reason", {
                                                reason: reasonLabel(report.reportReason),
                                            })}
                                        </Typography>
                                    ) : null}
                                    <Typography type="body-xs" color="muted">
                                        {t("moderation.source", {
                                            source: sourceLabel(report.source),
                                        })}
                                    </Typography>
                                    {reportedAt ? (
                                        <Typography type="body-xs" color="muted">
                                            {t("moderation.reportedAt", { time: reportedAt })}
                                        </Typography>
                                    ) : null}
                                    {/* Only a POST can be linked: `/community/[postId]` takes the
                                        reported object's own id. A COMMENT id needs its postId to
                                        build a url and a USER id cannot address `/u/[username]`
                                        (that route keys off the username) — both need the BE to
                                        widen the queue payload, so those rows say so instead of
                                        dumping the uuid on screen. The link opens in a NEW TAB so
                                        the queue (and its optimistic state) stays mounted. */}
                                    {report.targetType === "POST" ? (
                                        <Link
                                            href={`/community/${report.targetId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex max-w-full items-center gap-1 text-accent hover:underline"
                                        >
                                            <Typography type="body-xs" truncate className="text-accent">
                                                {t("moderation.openTarget")}
                                            </Typography>
                                            <ArrowSquareOutIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-3.5 shrink-0"
                                            />
                                        </Link>
                                    ) : (
                                        <Typography type="body-xs" color="muted">
                                            {t("moderation.targetNotLinkable")}
                                        </Typography>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                        )
                    })}
                </div>
            </AsyncContent>
        </div>
    )
}
