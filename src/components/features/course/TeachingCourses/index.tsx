"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryTeachingCoursesSwr } from "../hooks/useQueryTeachingCoursesSwr"

/** Status → HeroUI Chip color. PUBLISHED = live (success), DRAFT = editable (warning). */
const statusColor = (status: string): "success" | "warning" | "default" => {
    if (status === "PUBLISHED") return "success"
    if (status === "DRAFT") return "warning"
    return "default"
}

/**
 * "Khoá tôi dạy" (`/courses/teaching`) — courses the signed-in instructor OWNS, every
 * status, newest-updated first. Each card links into the course's AI-interview manager
 * so a lecturer can generate/curate the question set. The public catalog only shows
 * PUBLISHED courses, so this is the only place a lecturer reaches their DRAFT/ARCHIVED
 * courses. Loading gates card skeletons; an empty set shows an onboarding empty state.
 */
export const TeachingCourses = () => {
    const t = useTranslations()
    const router = useRouter()
    const { courses, isLoading, error, mutate } = useQueryTeachingCoursesSwr()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("courses.teaching.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("courses.teaching.subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading}
                skeleton={(
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-large" />
                        ))}
                    </div>
                )}
                error={courses.length === 0 ? error : undefined}
                errorContent={{
                    title: t("courses.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("courses.retry"),
                }}
                isEmpty={courses.length === 0}
                emptyContent={{
                    title: t("courses.teaching.empty"),
                    action: (
                        <Button variant="primary" onPress={() => router.push("/courses")}>
                            {t("courses.teaching.browse")}
                        </Button>
                    ),
                }}
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/courses/${course.slugName}/learn/interview`}
                            className="group block no-underline"
                        >
                            <div className="flex h-full flex-col gap-3 rounded-2xl border border-default bg-surface p-4 transition-colors group-hover:border-accent">
                                <div className="flex items-start justify-between gap-2">
                                    <Typography type="body-sm" weight="semibold" className="line-clamp-2 group-hover:underline">
                                        {course.title}
                                    </Typography>
                                    <Chip size="sm" variant="soft" color={statusColor(course.status)}>
                                        <Chip.Label>{t(`courses.status.${course.status}`)}</Chip.Label>
                                    </Chip>
                                </div>
                                {course.courseCode ? (
                                    <Typography type="body-xs" color="muted">{course.courseCode}</Typography>
                                ) : null}
                                <Typography type="body-xs" color="muted" className="mt-auto">
                                    {t("courses.teaching.manageHint")}
                                </Typography>
                            </div>
                        </Link>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
