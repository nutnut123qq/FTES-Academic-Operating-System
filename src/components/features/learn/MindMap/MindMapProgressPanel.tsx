"use client"

import React, { useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    ArrowRightIcon,
    CaretDownIcon,
    CaretUpIcon,
    LockSimpleIcon,
    SparkleIcon,
    TargetIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { ModuleRef, ProgressInsight } from "./progress"

interface MindMapProgressPanelProps extends WithClassNames<undefined> {
    insight: ProgressInsight
    /** Route into / gate the recommended lesson (mirrors a node click on the map). */
    onOpenRecommendation: () => void
}

/** Up to three module chips + a "+N" overflow pill. */
const ModuleChips = ({ refs, tone }: { refs: Array<ModuleRef>; tone: "success" | "warning" }) => {
    const shown = refs.slice(0, 3)
    const extra = refs.length - shown.length
    return (
        <div className="flex flex-wrap gap-2">
            {shown.map((ref) => (
                <Chip key={ref.moduleId} size="sm" variant="soft" color={tone}>
                    <Chip.Label>
                        {ref.title}
                        {tone === "warning" ? ` · ${ref.done}/${ref.total}` : ""}
                    </Chip.Label>
                </Chip>
            ))}
            {extra > 0 ? (
                <Chip size="sm" variant="secondary">
                    <Chip.Label>+{extra}</Chip.Label>
                </Chip>
            ) : null}
        </div>
    )
}

/**
 * Floating study-progress assistant over the mind map. It reads the deterministic
 * {@link ProgressInsight} (see `progress.ts`) and surfaces, in one glance:
 *  - overall completion (bar + lesson tally),
 *  - the ONE recommended next step, with a plain-language reason + a "Học ngay" jump,
 *  - the learner's finished modules (strengths) and the modules to finish (review).
 *
 * The recommendation is rule-based today; the panel is the surface a later
 * ai-platform coaching job would enrich (richer NL insight over the same snapshot).
 * Collapsible so it never fights the canvas on small screens.
 */
export const MindMapProgressPanel = ({ insight, onOpenRecommendation, className }: MindMapProgressPanelProps) => {
    const t = useTranslations("learn")
    const [open, setOpen] = useState(true)
    const { recommendation: rec, overallPercent, lessons, strengths, review } = insight
    const isDone = rec.kind === "done"

    return (
        <div
            className={cn(
                "absolute left-3 top-3 z-10 w-[300px] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-separator bg-content1/95 shadow-lg backdrop-blur sm:w-[320px]",
                className,
            )}
        >
            {/* header — assistant title + overall % + collapse toggle */}
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-default/40"
            >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <SparkleIcon weight="fill" aria-hidden focusable="false" className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                    <Typography type="body-sm" weight="semibold">
                        {t("mindMap.progress.title")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("mindMap.progress.overall", { percent: overallPercent })}
                    </Typography>
                </span>
                {open ? (
                    <CaretUpIcon aria-hidden focusable="false" className="size-4 text-muted" />
                ) : (
                    <CaretDownIcon aria-hidden focusable="false" className="size-4 text-muted" />
                )}
            </button>

            {open ? (
                <div className="flex flex-col gap-3 px-3 pb-3">
                    {/* overall bar + lesson tally */}
                    <div className="flex flex-col gap-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-default">
                            <div
                                className="h-full rounded-full bg-accent transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, overallPercent))}%` }}
                            />
                        </div>
                        <Typography type="body-xs" color="muted">
                            {t("mindMap.progress.lessonsDone", { done: lessons.completed, total: lessons.total })}
                        </Typography>
                    </div>

                    {/* recommended next step */}
                    <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-accent">
                                <TargetIcon weight="fill" aria-hidden focusable="false" className="size-4" />
                                <Typography type="body-xs" weight="medium" className="text-accent">
                                    {t("mindMap.progress.nextLabel")}
                                </Typography>
                            </div>
                            {isDone ? (
                                <Typography type="body-sm" weight="medium">
                                    {t("mindMap.progress.reason.done")}
                                </Typography>
                            ) : (
                                <>
                                    <div className="flex flex-col">
                                        <Typography type="body-sm" weight="semibold" className="line-clamp-2">
                                            {rec.title}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="line-clamp-2">
                                            {t(`mindMap.progress.reason.${rec.reasonKey}`, rec.reasonValues)}
                                        </Typography>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={rec.isLocked ? "outline" : "primary"}
                                        onPress={onOpenRecommendation}
                                        className="w-full"
                                    >
                                        {rec.isLocked ? (
                                            <LockSimpleIcon aria-hidden focusable="false" className="size-4" />
                                        ) : (
                                            <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                                        )}
                                        {rec.isLocked ? t("mindMap.progress.unlockCta") : t("mindMap.progress.startCta")}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* strengths */}
                    {strengths.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <TrophyIcon weight="fill" aria-hidden focusable="false" className="size-4 text-success" />
                                <Typography type="body-xs" weight="medium">
                                    {t("mindMap.progress.strengths")}
                                </Typography>
                            </div>
                            <ModuleChips refs={strengths} tone="success" />
                        </div>
                    ) : null}

                    {/* modules to finish */}
                    {review.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <TargetIcon aria-hidden focusable="false" className="size-4 text-warning" />
                                <Typography type="body-xs" weight="medium">
                                    {t("mindMap.progress.review")}
                                </Typography>
                            </div>
                            <ModuleChips refs={review} tone="warning" />
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
