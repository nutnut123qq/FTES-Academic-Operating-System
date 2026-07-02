"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import {
    ArchiveIcon,
    CheckCircleIcon,
    GlobeIcon,
    NotePencilIcon,
    RobotIcon,
    ShieldCheckIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import {
    useQueryWorkflowSwr,
    type WorkflowStage,
    type WorkflowItem,
} from "../hooks/useQueryWorkflowSwr"

/** Stages in pipeline order — one board column each (§19). */
const STAGES: Array<WorkflowStage> = ["draft", "aiReview", "modReview", "approved", "published", "archived"]

/** Phosphor icon per stage; header glyph mirrors the pipeline step. */
const STAGE_ICON: Record<WorkflowStage, React.ComponentType<{ className?: string }>> = {
    draft: NotePencilIcon,
    aiReview: RobotIcon,
    modReview: ShieldCheckIcon,
    approved: CheckCircleIcon,
    published: GlobeIcon,
    archived: ArchiveIcon,
}

/**
 * Workflow board (§19) — a read-only kanban of content moving through the review
 * pipeline (Draft → AI Review → Mod Review → Approved → Published → Archived). One
 * column per stage headed by label + count; cards show title + a content-type chip.
 * Feature owns data (mock) + grouping; tokens own the look. ponytail: no drag/DnD —
 * static columns off a mock SWR list; wire mutations when the BE contract lands.
 */
export const WorkflowBoard = () => {
    const t = useTranslations("workflow")
    const { items } = useQueryWorkflowSwr()

    const byStage = (stage: WorkflowStage): Array<WorkflowItem> =>
        items.filter((item) => item.stage === stage)

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {/* kanban columns — horizontal scroll on small screens */}
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
                {STAGES.map((stage) => {
                    const cards = byStage(stage)
                    const StageIcon = STAGE_ICON[stage]
                    return (
                        <section
                            key={stage}
                            aria-label={t(`stages.${stage}`)}
                            className="flex w-72 shrink-0 flex-col gap-3 rounded-large border border-separator bg-default/20 p-3"
                        >
                            <div className="flex items-center gap-2">
                                <StageIcon className="size-4 shrink-0 text-accent" aria-hidden />
                                <Typography type="body-sm" weight="medium" className="min-w-0 truncate">
                                    {t(`stages.${stage}`)}
                                </Typography>
                                <Chip size="sm" variant="soft" color="default" className="ms-auto">
                                    {t("itemsCount", { count: cards.length })}
                                </Chip>
                            </div>

                            <div className="flex flex-col gap-2">
                                {cards.length === 0 ? (
                                    <Typography type="body-xs" color="muted" className="px-1 py-4 text-center">
                                        {t("emptyColumn")}
                                    </Typography>
                                ) : (
                                    cards.map((item) => (
                                        <article
                                            key={item.id}
                                            className="flex flex-col gap-2 rounded-large border border-separator bg-surface p-3"
                                        >
                                            <Typography type="body-sm" weight="medium">
                                                {item.title}
                                            </Typography>
                                            <Chip size="sm" variant="soft" color="accent" className="self-start">
                                                {t(`contentTypes.${item.contentType}`)}
                                            </Chip>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
