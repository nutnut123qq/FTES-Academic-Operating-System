"use client"

import React, { useEffect, useMemo, useState } from "react"
import { cn, Chip, Drawer, Pagination, ScrollShadow } from "@heroui/react"
import { useTranslations } from "next-intl"
import { dayjs, getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { ModelByline } from "@/components/blocks/grading/GradingByline"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import type { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import type { SubmissionAttemptEntity } from "@/modules/types/entities/submission-attempt"

/** Attempts per page inside the history drawer. */
const HISTORY_PAGE_SIZE = 6

/** Props for {@link SubmissionResultHistoryDrawer}. */
export type SubmissionResultHistoryDrawerProps = {
    /** Whether the drawer is open. */
    isOpen: boolean
    /** Open/close callback (also closes when a row is selected). */
    onOpenChange: (open: boolean) => void
    /** Full attempt list (newest first). */
    attempts: Array<SubmissionAttemptEntity>
    /** Currently selected attempt (highlighted row). */
    selectedAttemptId?: string
    /** Requirement max score (for the `x/max` label + verdict threshold). */
    maxScore: number
    /** Pass threshold ratio (verdict per row). */
    passThreshold: number
    /** Served-model id → tier category (for the model byline chip). */
    modelCategoryMap: Map<string, AiModelCategory>
    /** Select an attempt (the page navigates `?attempt=`). */
    onSelect: (attemptId: string) => void
}

/**
 * Submission-history drawer: each attempt as a bordered surface-card row (verdict,
 * score, the AI model that graded it + tier, time), paginated client-side. Right
 * on desktop, bottom sheet on mobile. Co-located with the other attempt drawers
 * (see {@link DrawerContainer}); presentational — the page owns open + selection.
 */
export const SubmissionResultHistoryDrawer = ({
    isOpen,
    onOpenChange,
    attempts,
    selectedAttemptId,
    maxScore,
    passThreshold,
    modelCategoryMap,
    onSelect,
}: SubmissionResultHistoryDrawerProps) => {
    const t = useTranslations()
    const { isMobile } = useSmViewpoint()
    const [page, setPage] = useState(1)

    // reset to the first page whenever the drawer opens
    useEffect(() => {
        if (isOpen) {
            setPage(1)
        }
    }, [isOpen])

    const totalPages = Math.max(1, Math.ceil(attempts.length / HISTORY_PAGE_SIZE))
    const pagedAttempts = useMemo(
        () => attempts.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE),
        [attempts, page],
    )

    // verdict + score for a row, guarding an unknown threshold (treat as NOT passing)
    const isPassing = (score: number | null) =>
        passThreshold > 0 && maxScore > 0 && (score ?? 0) >= passThreshold * maxScore
    const scoreLabel = (score: number | null) => (maxScore > 0 ? `${score ?? 0}/${maxScore}` : `${score ?? 0}`)

    return (
        <Drawer>
            <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="backdrop-blur-sm">
                <Drawer.Content placement={isMobile ? "bottom" : "right"}>
                    <Drawer.Dialog className="p-0">
                        <div className="p-3">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>
                                    {`${t("submissionResult.history")} · ${attempts.length}`}
                                </Drawer.Heading>
                            </Drawer.Header>
                        </div>
                        <Drawer.Body>
                            <ScrollShadow hideScrollBar className="h-full p-4">
                                <SurfaceListCard>
                                    {pagedAttempts.map((attempt) => {
                                        const selected = attempt.id === selectedAttemptId
                                        const attemptPass = isPassing(attempt.score)
                                        const attemptCategory = attempt.servedModel
                                            ? modelCategoryMap.get(attempt.servedModel)
                                            : undefined
                                        const attemptTime = attempt.processedAt
                                            ? getTimeAgoLabel(getTimeAgoMessage(dayjs(attempt.processedAt)), t)
                                            : null
                                        return (
                                            <SurfaceListCardItem
                                                key={attempt.id}
                                                onPress={() => {
                                                    onSelect(attempt.id)
                                                    onOpenChange(false)
                                                }}
                                                className={selected ? "bg-accent/10" : undefined}
                                            >
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {t("submissionAttempts.attemptLine", { number: attempt.attemptNumber })}
                                                        </span>
                                                        <Chip color={attemptPass ? "success" : "danger"} variant="soft" size="sm">
                                                            <Chip.Label>
                                                                {t(attemptPass ? "submissionResult.passed" : "submissionResult.failed")}
                                                            </Chip.Label>
                                                        </Chip>
                                                        <span className={cn("ml-auto text-sm", attemptPass ? "text-success" : "text-muted")}>
                                                            {scoreLabel(attempt.score)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                                                        <ModelByline model={attempt.servedModel} category={attemptCategory} />
                                                        {attemptTime ? <span className="ml-auto">{attemptTime}</span> : null}
                                                    </div>
                                                </div>
                                            </SurfaceListCardItem>
                                        )
                                    })}
                                </SurfaceListCard>
                            </ScrollShadow>
                        </Drawer.Body>
                        {totalPages > 1 ? (
                            <Drawer.Footer className="border-t">
                                <Pagination aria-label={t("submissionResult.history")} size="sm" className="w-full justify-start">
                                    <Pagination.Content className="flex flex-wrap justify-start gap-2">
                                        <Pagination.Item>
                                            <Pagination.Previous
                                                aria-label={t("common.pagination.previous")}
                                                isDisabled={page <= 1}
                                                onPress={() => setPage((current) => Math.max(1, current - 1))}
                                                className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                            >
                                                <Pagination.PreviousIcon />
                                            </Pagination.Previous>
                                        </Pagination.Item>
                                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                                            <Pagination.Item key={pageNumber}>
                                                <Pagination.Link
                                                    isActive={pageNumber === page}
                                                    onPress={() => setPage(pageNumber)}
                                                    className="cursor-pointer rounded-medium transition-colors hover:bg-default data-[active=true]:hover:bg-accent"
                                                >
                                                    {pageNumber}
                                                </Pagination.Link>
                                            </Pagination.Item>
                                        ))}
                                        <Pagination.Item>
                                            <Pagination.Next
                                                aria-label={t("common.pagination.next")}
                                                isDisabled={page >= totalPages}
                                                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                                                className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                            >
                                                <Pagination.NextIcon />
                                            </Pagination.Next>
                                        </Pagination.Item>
                                    </Pagination.Content>
                                </Pagination>
                            </Drawer.Footer>
                        ) : null}
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>
        </Drawer>
    )
}
