"use client"

import React, { useEffect, useRef } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { ArrowSquareOutIcon, BookOpenIcon, GraduationCapIcon, LockKeyIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { domainVar } from "../palette"
import type { SkillNode } from "../hooks/useQuerySkillGraphSwr"

/** Props for {@link SkillDetailPanel}. */
export interface SkillDetailPanelProps {
    skill: SkillNode
    /** Close the panel; the caller returns focus to the graph. */
    onClose: () => void
    className?: string
}

/**
 * Detail side panel for a selected skill: level progress, status, and links to
 * related subjects/courses that navigate into the workspace. Announced as a
 * dialog; Escape closes and returns focus (handled by the caller via `onClose`).
 */
export const SkillDetailPanel = ({ skill, onClose, className }: SkillDetailPanelProps) => {
    const t = useTranslations()
    const closeRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        // Move focus into the panel on open (a11y) and close on Escape.
        closeRef.current?.focus()
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [onClose])

    return (
        <aside
            role="dialog"
            aria-label={t("skillGraph.panel.title", { name: skill.name })}
            className={cn(
                "flex w-full flex-col gap-4 rounded-large border border-default bg-surface p-4 sm:w-72",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2">
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: domainVar(skill.domain) }}
                            aria-hidden
                        />
                        <Typography type="body-xs" color="muted">
                            {t(`skillGraph.domains.${skill.domain}`)}
                        </Typography>
                    </span>
                    <Typography type="h6" weight="bold">
                        {skill.name}
                    </Typography>
                </div>
                <Button
                    ref={closeRef}
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label={t("skillGraph.panel.close")}
                    onPress={onClose}
                >
                    <XIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                {skill.status === "mastered" ? (
                    <GraduationCapIcon aria-hidden focusable="false" className="size-4 text-success" weight="fill" />
                ) : skill.status === "locked" ? (
                    <LockKeyIcon aria-hidden focusable="false" className="size-4 text-muted" />
                ) : null}
                <Chip
                    size="sm"
                    variant="soft"
                    color={skill.status === "mastered" ? "success" : skill.status === "learning" ? "accent" : "default"}
                >
                    {t(`skillGraph.statuses.${skill.status}`)}
                </Chip>
            </div>

            <ProgressMeter value={skill.level} label={t("skillGraph.panel.level")} showValue />


            {(skill.subjectIds.length > 0 || skill.courseIds.length > 0) && (
                <div className="flex flex-col gap-2 border-t border-separator pt-3">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t("skillGraph.panel.related")}
                    </Typography>
                    <div className="flex flex-col gap-1.5">
                        {skill.subjectIds.map((subjectId) => (
                            <Link
                                key={subjectId}
                                href={`/subjects/${subjectId}`}
                                className="flex items-center gap-2 text-sm text-accent hover:underline"
                            >
                                <BookOpenIcon aria-hidden focusable="false" className="size-4" />
                                <span className="min-w-0 flex-1 truncate">{subjectId}</span>
                                <ArrowSquareOutIcon aria-hidden focusable="false" className="size-3.5 shrink-0" />
                            </Link>
                        ))}
                        {skill.courseIds.map((courseId) => (
                            <Link
                                key={courseId}
                                href={`/courses/${courseId}`}
                                className="flex items-center gap-2 text-sm text-accent hover:underline"
                            >
                                <GraduationCapIcon aria-hidden focusable="false" className="size-4" />
                                <span className="min-w-0 flex-1 truncate">{courseId}</span>
                                <ArrowSquareOutIcon aria-hidden focusable="false" className="size-3.5 shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    )
}
