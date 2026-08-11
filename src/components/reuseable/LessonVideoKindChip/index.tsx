"use client"

import React, { useMemo } from "react"
import { Chip, Tooltip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FilmStripIcon, SparkleIcon, TwitchLogoIcon } from "@phosphor-icons/react"
import { LessonVideoKind } from "@/modules/types/enums/lesson-video-kind"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * The props for the LessonVideoKindChip component.
 * @param kind - The kind of the lesson video.
 */
export interface LessonVideoKindChipProps extends WithClassNames<undefined> {
    /** Lesson video kind from the API. */
    kind: LessonVideoKind
}

/**
 * Chip with a tooltip explaining the lesson video kind (raw stream, edited, premium).
 */
export const LessonVideoKindChip = ({ kind, className }: LessonVideoKindChipProps) => {
    const t = useTranslations()
    const renderLessonVideoKind = () => {
        switch (kind) {
        case LessonVideoKind.RawStream:
            return {
                icon: <TwitchLogoIcon aria-hidden focusable="false" className="size-5" />,
                label: "lessonVideoKind.rawStream.label",
                tooltip: "lessonVideoKind.rawStream.tooltip",
            }
        case LessonVideoKind.EditedStream:
            return {
                icon: <SparkleIcon aria-hidden focusable="false" className="size-5" />,
                label: "lessonVideoKind.editedStream.label",
                tooltip: "lessonVideoKind.editedStream.tooltip",
            }
        case LessonVideoKind.PremiumRecord:
            return {
                icon: <FilmStripIcon aria-hidden focusable="false" className="size-5" />,
                label: "lessonVideoKind.premiumRecord.label",
                tooltip: "lessonVideoKind.premiumRecord.tooltip",
            }
        default:
            throw new Error(`Invalid kind: ${kind}`)
        }
    }
    const { icon, label, tooltip } = useMemo(() => renderLessonVideoKind(), [kind])
    return (
        <Tooltip>
            <Tooltip.Trigger>
                <Chip color="warning" size="sm" variant="soft" className={cn(className)}>
                    {icon}
                    <Chip.Label>{t(label)}</Chip.Label>
                </Chip>
            </Tooltip.Trigger>
            <Tooltip.Content>{t(tooltip)}</Tooltip.Content>
        </Tooltip>
    )
}
