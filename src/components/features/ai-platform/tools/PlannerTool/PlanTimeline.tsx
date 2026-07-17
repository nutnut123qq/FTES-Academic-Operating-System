"use client"

import React, { useState } from "react"
import { Button, Checkbox, Chip, Label, Modal, Typography } from "@heroui/react"
import { ClockIcon, TargetIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { AiToolModelNote } from "../AiToolShell"
import type { StudyPlanView } from "@/modules/api/rest/ai"
import { buildTaskKey, isTaskDone } from "./logic"

/** Props for {@link PlanTimeline}. */
export interface PlanTimelineProps {
    /** The plan to render (the parent's live copy — optimistic updates flow through it). */
    plan: StudyPlanView
    /** Toggle one task; the parent owns the optimistic update + PATCH + rollback. */
    onToggleTask: (taskKey: string, done: boolean) => void
    /** Archive this plan (parent confirms + calls the API). */
    onArchive: () => void
    /** True while an archive request is in flight. */
    isArchiving: boolean
}

/**
 * Renders a study plan as a vertical week timeline: an overall progress bar (driven by
 * the BE `percentDone`), then one card per week with its focus, milestone, and a task
 * checklist. Checking a task calls `onToggleTask("w{week}:{index}", done)`; the parent
 * applies it optimistically and rolls back on error. Archiving is confirmed in a modal.
 */
export const PlanTimeline = ({ plan, onToggleTask, onArchive, isArchiving }: PlanTimelineProps) => {
    const t = useTranslations("aiPlatform.toolPages.planner")
    const [confirmOpen, setConfirmOpen] = useState(false)
    const weeks = plan.plan?.weeks ?? []
    const tips = plan.plan?.tips ?? []

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <ProgressMeter
                    value={plan.percentDone}
                    max={100}
                    label={t("progressLabel")}
                    showValue
                    aria-label={t("progressLabel")}
                />
            </div>

            <ol className="flex flex-col gap-4">
                {weeks.map((week) => (
                    <li
                        key={week.week}
                        className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Typography type="body-sm" weight="semibold" className="text-accent">
                                {t("week", { number: week.week })}
                            </Typography>
                            {week.focus ? (
                                <Typography type="body-sm" weight="medium" className="min-w-0">
                                    {week.focus}
                                </Typography>
                            ) : null}
                        </div>

                        {week.milestone ? (
                            <div className="flex items-center gap-2 text-muted">
                                <TargetIcon aria-hidden focusable="false" className="size-4 shrink-0" />
                                <Typography type="body-xs" color="muted">
                                    {t("milestone", { milestone: week.milestone })}
                                </Typography>
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-2">
                            {(week.tasks ?? []).map((task, index) => {
                                const taskKey = buildTaskKey(week.week, index)
                                const done = isTaskDone(plan.progress, taskKey)
                                const inputId = `task-${taskKey}`
                                return (
                                    <Checkbox
                                        key={taskKey}
                                        id={inputId}
                                        variant="secondary"
                                        isSelected={done}
                                        onChange={() => onToggleTask(taskKey, !done)}
                                    >
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        <Checkbox.Content>
                                            <Label htmlFor={inputId}>
                                                <div className="flex flex-col gap-0.5">
                                                    <span
                                                        className={
                                                            done
                                                                ? "text-sm text-muted line-through"
                                                                : "text-sm text-foreground"
                                                        }
                                                    >
                                                        {task.title ?? taskKey}
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {task.est_hours ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-muted">
                                                                <ClockIcon
                                                                    aria-hidden
                                                                    focusable="false"
                                                                    className="size-3.5"
                                                                />
                                                                {t("estHours", { count: task.est_hours })}
                                                            </span>
                                                        ) : null}
                                                        {task.resource_hint ? (
                                                            <Typography type="body-xs" color="muted">
                                                                {task.resource_hint}
                                                            </Typography>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </Label>
                                        </Checkbox.Content>
                                    </Checkbox>
                                )
                            })}
                        </div>
                    </li>
                ))}
            </ol>

            {tips.length ? (
                <section className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="semibold">
                        {t("tips")}
                    </Typography>
                    <ul className="flex flex-wrap gap-2">
                        {tips.map((tip, index) => (
                            <Chip key={index} variant="secondary" size="sm">
                                {tip}
                            </Chip>
                        ))}
                    </ul>
                </section>
            ) : null}

            <div className="flex items-center justify-between gap-3">
                <AiToolModelNote model={plan.modelUsed} />
                <Button
                    variant="tertiary"
                    size="sm"
                    onPress={() => setConfirmOpen(true)}
                    isDisabled={isArchiving}
                >
                    <TrashIcon aria-hidden focusable="false" className="size-4" />
                    {t("archive")}
                </Button>
            </div>

            <Modal
                isOpen={confirmOpen}
                onOpenChange={(open) => {
                    if (!open) setConfirmOpen(false)
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="w-full max-w-sm">
                            <Modal.Header>
                                <Typography type="body" weight="bold">
                                    {t("archiveConfirmTitle")}
                                </Typography>
                            </Modal.Header>
                            <Modal.Body>
                                <Typography type="body-sm" color="muted">
                                    {t("archiveConfirmBody", { goal: plan.goal })}
                                </Typography>
                            </Modal.Body>
                            <Modal.Footer className="justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onPress={() => setConfirmOpen(false)}
                                    isDisabled={isArchiving}
                                >
                                    {t("cancel")}
                                </Button>
                                <Button
                                    variant="danger"
                                    onPress={() => {
                                        setConfirmOpen(false)
                                        onArchive()
                                    }}
                                    isPending={isArchiving}
                                >
                                    {t("archive")}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    )
}
