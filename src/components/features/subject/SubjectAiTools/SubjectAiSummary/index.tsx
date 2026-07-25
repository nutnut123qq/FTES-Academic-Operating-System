"use client"

import React from "react"
import { Button, Chip, Spinner, Typography, toast } from "@heroui/react"
import { ArrowClockwiseIcon, CopyIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRequireAuth } from "@/hooks/useRequireAuth"

import { useQuerySubjectAiResourceSourcesSwr } from "../../hooks/useQuerySubjectAiResourceSourcesSwr"
import { useMutateSubjectAiSummarySwr } from "../../hooks/useMutateSubjectAiSummarySwr"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { SourcePicker } from "../SourcePicker"

/** Props for {@link SubjectAiSummary}. */
export interface SubjectAiSummaryProps {
    subjectId: string
    /** Subject code — part of the hub's shared tool-surface prop shape. */
    subjectCode?: string
    /** Back to the hub. */
    onBack: () => void
    /** Navigate to the Resources tab (empty-state link). */
    onGoResources: () => void
}

/**
 * Summary tool surface, wired to the REAL async summary job.
 *
 * Pick one of the subject's resources (real resource UUIDs from the Resource Hub) →
 * `POST /ai/learning/summary` → poll `GET /ai/jobs/{id}` until terminal → render the
 * worker's key points, TL;DR and glossary. A failed regenerate keeps the previous
 * summary on screen; quota / permission rejections get their own message.
 */
export const SubjectAiSummary = ({
    subjectId,
    onBack,
    onGoResources,
}: SubjectAiSummaryProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const { guard } = useRequireAuth()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const {
        sources,
        isLoading: isSourcesLoading,
        error: sourcesError,
        mutate: reloadSources,
    } = useQuerySubjectAiResourceSourcesSwr(subjectId)
    const summary = useMutateSubjectAiSummarySwr()

    const [selectedId, setSelectedId] = React.useState<string | null>(null)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    const selected = sources.find((source) => source.id === selectedId) ?? null

    // AI jobs are auth-scoped (permission `ai.learning.use`) — guests get the sign-in
    // modal instead of a 401 round-trip.
    const generate = guard(() => {
        if (!selected || summary.isBusy) return
        summary.generate({ resourceId: selected.id, language: locale })
    })

    const copy = async () => {
        if (!summary.data) return
        const text = [
            ...summary.data.keyPoints.map((point) => `• ${point}`),
            "",
            summary.data.abstract,
        ].join("\n")
        await navigator.clipboard.writeText(text)
        toast.success(t("subjects.aiTools.summary.copied"))
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tools.summary.title")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
            />

            <AsyncContent
                isLoading={isSourcesLoading && sources.length === 0}
                skeleton={
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-12 w-full rounded-2xl" />
                        ))}
                    </div>
                }
                error={!sources.length ? sourcesError : undefined}
                errorContent={{
                    title: t("subjects.aiTools.sourcesErrorTitle"),
                    onRetry: () => {
                        void reloadSources()
                    },
                    retryLabel: t("subjects.aiTools.retry"),
                }}
            >
                {sources.length === 0 ? (
                    <EmptyContent
                        title={t("subjects.aiTools.summary.emptyTitle")}
                        description={t("subjects.aiTools.summary.emptyDesc")}
                        onRetry={onGoResources}
                        retryLabel={t("subjects.aiTools.goResources")}
                    />
                ) : (
                    <div className="flex flex-col gap-6">
                        <SourcePicker
                            label={t("subjects.aiTools.pickSource")}
                            sources={sources}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                        <Button
                            variant="primary"
                            className="self-start"
                            isDisabled={!selected || summary.isBusy}
                            isPending={summary.isBusy}
                            onPress={generate}
                        >
                            {summary.isBusy
                                ? t("subjects.aiTools.job.working")
                                : summary.data
                                    ? t("subjects.aiTools.summary.regenerate")
                                    : t("subjects.aiTools.summary.generate")}
                        </Button>

                        {summary.isBusy ? (
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                                <Spinner size="lg" />
                                <Typography type="body-sm" color="muted">
                                    {t("subjects.aiTools.job.running")}
                                </Typography>
                                {summary.isStale ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Typography type="body-xs" color="muted">
                                            {t("subjects.aiTools.job.stale")}
                                        </Typography>
                                        <Button
                                            size="sm"
                                            variant="tertiary"
                                            onPress={() => summary.refresh()}
                                        >
                                            {t("subjects.aiTools.job.refresh")}
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        ) : summary.errorKey ? (
                            <ErrorContent
                                title={t(`subjects.aiTools.job.${summary.errorKey}`)}
                                description={
                                    summary.failureMessage ??
                                    t("subjects.aiTools.errorRetryHint")
                                }
                                onRetry={generate}
                                retryLabel={t("subjects.aiTools.retry")}
                            />
                        ) : null}

                        {summary.data ? (
                            <div className="flex flex-col gap-4 rounded-2xl border border-separator p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <Typography type="body" weight="medium">
                                        {t("subjects.aiTools.summary.keyPoints")}
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="tertiary"
                                            isIconOnly
                                            aria-label={t("subjects.aiTools.summary.copy")}
                                            onPress={copy}
                                        >
                                            <CopyIcon
                                                className="size-5"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="tertiary"
                                            isIconOnly
                                            isDisabled={summary.isBusy}
                                            aria-label={t("subjects.aiTools.summary.regenerate")}
                                            onPress={generate}
                                        >
                                            <ArrowClockwiseIcon
                                                className="size-5"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        </Button>
                                    </div>
                                </div>

                                {summary.data.keyPoints.length ? (
                                    <ul className="flex list-disc flex-col gap-2 pl-5">
                                        {summary.data.keyPoints.map((point, index) => (
                                            <li key={index}>
                                                <Typography type="body-sm">{point}</Typography>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}

                                {summary.data.abstract ? (
                                    <Typography type="body-sm" color="muted">
                                        {summary.data.abstract}
                                    </Typography>
                                ) : null}

                                {summary.data.readMinutes ? (
                                    <Chip
                                        size="sm"
                                        variant="soft"
                                        color="default"
                                        className="self-start"
                                    >
                                        {t("subjects.aiTools.summary.readMin", {
                                            count: summary.data.readMinutes,
                                        })}
                                    </Chip>
                                ) : null}

                                {summary.data.glossary.length ? (
                                    <div className="flex flex-col gap-2">
                                        <Typography type="body-sm" weight="medium">
                                            {t("subjects.aiTools.summary.glossary")}
                                        </Typography>
                                        <dl className="flex flex-col gap-2">
                                            {summary.data.glossary.map((entry, index) => (
                                                <div key={index} className="flex flex-col gap-0.5">
                                                    <dt>
                                                        <Typography type="body-sm" weight="medium">
                                                            {entry.term}
                                                        </Typography>
                                                    </dt>
                                                    <dd>
                                                        <Typography type="body-sm" color="muted">
                                                            {entry.definition}
                                                        </Typography>
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                ) : null}

                                {summary.data.model ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("subjects.aiTools.job.model", {
                                            model: summary.data.model,
                                        })}
                                    </Typography>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                )}
            </AsyncContent>
        </div>
    )
}
