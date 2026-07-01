"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryCourseDetailSwr } from "../hooks/useQueryCourseDetailSwr"

/**
 * Course detail / sales page (§4). DEFAULT on-canon layout: an identity hero +
 * description + a section→lesson outline + an enroll CTA. ponytail: hand-rolled;
 * mock data; CTA is a no-op.
 */
export const CourseDetail = () => {
    const t = useTranslations("courseSystem")
    const { courseId } = useParams<{ courseId: string }>()
    const { course } = useQueryCourseDetailSwr(courseId)

    if (!course) {
        return null
    }

    const totalLessons = course.sections.reduce((sum, section) => sum + section.lessons.length, 0)

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            {/* hero */}
            <div className="flex flex-col gap-3 border-b border-separator pb-6">
                <div className="flex items-center gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-large bg-accent/10 text-lg font-bold text-accent">
                        {course.code.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <Typography type="h4" weight="bold" truncate>
                            {course.code} · {course.name}
                        </Typography>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`levels.${course.level}`)}
                            </Chip>
                            <Typography type="body-xs" color="muted">
                                {t("detail.credits", { count: course.credits })} · {t("catalog.lessonsCount", { count: totalLessons })}
                            </Typography>
                        </div>
                    </div>
                    <Button variant="secondary" className="ml-auto hidden sm:flex">
                        {t("detail.enroll")}
                    </Button>
                </div>
                <Typography type="body-sm" color="muted">
                    {course.description}
                </Typography>
                <Button variant="secondary" className="self-start sm:hidden">
                    {t("detail.enroll")}
                </Button>
            </div>

            {/* outline */}
            <div className="flex flex-col gap-6">
                <Typography type="h6" weight="bold">
                    {t("detail.outline")}
                </Typography>
                {course.sections.map((section) => (
                    <div key={section.id} className="flex flex-col gap-2">
                        <Typography type="body" weight="medium">
                            {section.title}
                        </Typography>
                        {section.lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className="flex items-center gap-3 rounded-large border border-separator p-4"
                            >
                                <Typography type="body-sm" className="min-w-0 flex-1" truncate>
                                    {lesson.title}
                                </Typography>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
