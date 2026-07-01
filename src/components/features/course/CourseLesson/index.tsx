"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useQueryLessonSwr } from "../hooks/useQueryLessonSwr"

/**
 * Lesson view (§4). DEFAULT on-canon layout: a video placeholder + a documents
 * list + prev/next navigation. ponytail: video is a static placeholder box; mock
 * data; docs not downloadable.
 */
export const CourseLesson = () => {
    const t = useTranslations("courseSystem")
    const router = useRouter()
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
    const { lesson } = useQueryLessonSwr(courseId, lessonId)

    if (!lesson) {
        return null
    }

    const goTo = (id: string | null) => {
        if (id) {
            router.push(`/courses/${courseId}/lessons/${id}`)
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {lesson.title}
            </Typography>

            {/* video placeholder */}
            <div className="flex aspect-video w-full items-center justify-center rounded-large bg-default/40">
                <Typography type="body-sm" color="muted">
                    {t("lesson.videoPlaceholder")}
                </Typography>
            </div>

            {/* documents */}
            <div className="flex flex-col gap-3">
                <Typography type="h6" weight="bold">
                    {t("lesson.documents")}
                </Typography>
                {lesson.docs.map((doc) => (
                    <div
                        key={doc.id}
                        className="flex items-center gap-3 rounded-large border border-separator p-4"
                    >
                        <Typography type="body-sm" className="min-w-0 flex-1" truncate>
                            {doc.title}
                        </Typography>
                        <Button size="sm" variant="ghost">
                            {t("lesson.open")}
                        </Button>
                    </div>
                ))}
            </div>

            {/* prev / next */}
            <div className="flex items-center justify-between border-t border-separator pt-6">
                <Button
                    variant="ghost"
                    isDisabled={!lesson.prevId}
                    onPress={() => goTo(lesson.prevId)}
                >
                    {t("lesson.previous")}
                </Button>
                <Button
                    variant="secondary"
                    isDisabled={!lesson.nextId}
                    onPress={() => goTo(lesson.nextId)}
                >
                    {t("lesson.next")}
                </Button>
            </div>
        </div>
    )
}
