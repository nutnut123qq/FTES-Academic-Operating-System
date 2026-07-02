"use client"

import React from "react"
import { Button, Typography, toast } from "@heroui/react"
import { ArrowClockwiseIcon, CopyIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

import { useQuerySubjectAiSourcesSwr } from "../../hooks/useQuerySubjectAiSourcesSwr"
import { useMutateSubjectAiSummarySwr } from "../../hooks/useMutateSubjectAiSummarySwr"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { SourcePicker } from "../SourcePicker"

/** Props for {@link SubjectAiSummary}. */
export interface SubjectAiSummaryProps {
    subjectId: string
    subjectCode: string
    /** Back to the hub. */
    onBack: () => void
    /** Navigate to the Resources tab (empty-state link). */
    onGoResources: () => void
}

/**
 * Summary tool surface: pick a subject source → generate a mock summary (key
 * points + abstract) with loading skeleton, copy, and regenerate. Previous
 * summary is preserved on a failed regenerate.
 */
export const SubjectAiSummary = ({
    subjectId,
    subjectCode,
    onBack,
    onGoResources,
}: SubjectAiSummaryProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const { sources } = useQuerySubjectAiSourcesSwr(subjectId)
    const summarySwr = useMutateSubjectAiSummarySwr(subjectId)

    const [selectedId, setSelectedId] = React.useState<string | null>(null)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    const selected = sources.find((s) => s.id === selectedId) ?? null

    const generate = async () => {
        if (!selected) return
        try {
            await summarySwr.trigger({
                subjectCode,
                sourceTitle: selected.title,
            })
        } catch {
            // preserve prior summary; error rendered from summarySwr.error
        }
    }

    const copy = async () => {
        if (!summarySwr.data) return
        const text = [
            ...summarySwr.data.keyPoints.map((p) => `• ${p}`),
            "",
            summarySwr.data.abstract,
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

            {sources.length === 0 ? (
                <EmptyContent
                    title={t("subjects.aiTools.summary.emptyTitle")}
                    description={t("subjects.aiTools.summary.emptyDesc")}
                    onRetry={onGoResources}
                    retryLabel={t("subjects.aiTools.goResources")}
                />
            ) : (
                <>
                    <SourcePicker
                        label={t("subjects.aiTools.pickSource")}
                        sources={sources}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                    <Button
                        variant="primary"
                        className="self-start"
                        isDisabled={!selected || summarySwr.isMutating}
                        isPending={summarySwr.isMutating}
                        onPress={generate}
                    >
                        {summarySwr.data
                            ? t("subjects.aiTools.summary.regenerate")
                            : t("subjects.aiTools.summary.generate")}
                    </Button>

                    {summarySwr.isMutating ? (
                        <div className="flex flex-col gap-3">
                            <Skeleton.Typography type="body-sm" width="1/3" />
                            <Skeleton.Paragraph lines={4} />
                        </div>
                    ) : summarySwr.error && !summarySwr.data ? (
                        <ErrorContent
                            title={t("subjects.aiTools.summary.errorTitle")}
                            description={t("subjects.aiTools.errorRetryHint")}
                            onRetry={generate}
                            retryLabel={t("subjects.aiTools.retry")}
                        />
                    ) : summarySwr.data ? (
                        <div className="flex flex-col gap-3 rounded-large border border-separator p-4">
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
                            <ul className="flex list-disc flex-col gap-2 pl-5">
                                {summarySwr.data.keyPoints.map((point, i) => (
                                    <li key={i}>
                                        <Typography type="body-sm">
                                            {point}
                                        </Typography>
                                    </li>
                                ))}
                            </ul>
                            <Typography type="body-sm" color="muted">
                                {summarySwr.data.abstract}
                            </Typography>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    )
}
