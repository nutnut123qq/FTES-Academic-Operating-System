"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQuerySubjectLearningSwr } from "../hooks/useQuerySubjectLearningSwr"

/**
 * Learning tab (§3 → §4). DEFAULT on-canon layout (no dedicated brainstorm):
 * an overall progress bar + Section → Lesson list with a done/not-done state.
 * ponytail: progress bar + rows hand-rolled (icon-free status via Chip to avoid
 * icon risk); mock data until the BE course query exists.
 */
export const SubjectLearning = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { sections, total, done, percent } = useQuerySubjectLearningSwr(subjectId)

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* overall progress */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                    <Typography type="h5" weight="bold">
                        {t("learning.title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("learning.progressLabel", { done, total, percent })}
                    </Typography>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-default/40">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
            </div>

            {/* sections */}
            <div className="flex flex-col gap-6">
                {sections.map((section) => (
                    <div key={section.id} className="flex flex-col gap-3">
                        <Typography type="h6" weight="bold">
                            {section.title}
                        </Typography>
                        <div className="flex flex-col gap-2">
                            {section.lessons.map((lesson) => (
                                <div
                                    key={lesson.id}
                                    className={cn(
                                        "flex items-center gap-3 rounded-large border border-separator p-4",
                                    )}
                                >
                                    <Typography
                                        type="body-sm"
                                        weight="medium"
                                        className="min-w-0 flex-1"
                                        color={lesson.completed ? "muted" : undefined}
                                        truncate
                                    >
                                        {lesson.title}
                                    </Typography>
                                    {lesson.completed ? (
                                        <Chip size="sm" variant="soft" color="accent">
                                            {t("learning.done")}
                                        </Chip>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
