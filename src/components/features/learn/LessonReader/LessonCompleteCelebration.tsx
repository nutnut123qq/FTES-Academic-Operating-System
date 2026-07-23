"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { MascotCelebration } from "@/components/features/mascot-moments"

/** Props for {@link LessonCompleteCelebration}. */
export interface LessonCompleteCelebrationProps {
    /**
     * Lesson id — scopes the once-per-day cheer guard so each lesson celebrates at
     * most once per day (passed through to {@link MascotCelebration} as its id).
     */
    lessonId: string
    /** Class on the outer wrapper (spacing when embedded in the reader flow). */
    className?: string
}

/**
 * Lesson-complete cheer shown in the reader when a lesson is first completed.
 * A thin wrapper over the shared {@link MascotCelebration}: the anti-nag guard
 * (at most once per day per lesson) and the transient auto-hide live there; this
 * only supplies the lesson-scoped id and the translated copy
 * (`learn.reader.celebration`).
 *
 * @param props - {@link LessonCompleteCelebrationProps}
 */
export const LessonCompleteCelebration = ({ lessonId, className }: LessonCompleteCelebrationProps) => {
    const t = useTranslations("learn.reader.celebration")
    return (
        <MascotCelebration
            id={`lessonComplete.${lessonId}`}
            title={t("title")}
            body={t("body")}
            autoHideMs={8000}
            className={className}
        />
    )
}
