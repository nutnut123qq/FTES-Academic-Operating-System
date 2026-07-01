"use client"

import React from "react"
import { Card, CardContent, Link, cn } from "@heroui/react"
import type { LessonVideoEntity } from "@/modules/types/entities/lesson-video"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface LessonCardProps extends WithClassNames<undefined> {
    /** Lesson video row for lesson tab. */
    lessonVideo: LessonVideoEntity
}

/**
 * Render one lesson video card item.
 * @param {LessonCardProps} props Lesson video card props.
 */
export const LessonCard = ({ lessonVideo, className }: LessonCardProps) => {
    return (
        <Card className={cn("", className)}>
            <CardContent className="p-3">
                <Link href={lessonVideo.url} target="_blank" className="text-sm font-medium text-accent">
                    {lessonVideo.title}
                </Link>
                <div className="text-xs text-muted">{lessonVideo.description}</div>
            </CardContent>
        </Card>
    )
}
