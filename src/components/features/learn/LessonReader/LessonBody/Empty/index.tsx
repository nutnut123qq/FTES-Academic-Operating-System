"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@heroui/react"
import { WithClassNames } from "@/modules/types/base/class-name"

export type LessonBodyEmptyProps = WithClassNames<undefined>

/**
 * Empty state for lesson tab.
 * @param {LessonBodyEmptyProps} props Empty props (unused).
 */
export const LessonBodyEmpty = ({ className }: LessonBodyEmptyProps) => {
    const t = useTranslations()
    return (
        <div className={cn("text-sm text-muted", className)}>
            {t("content.lessonVideosEmpty")}
        </div>
    )
}
