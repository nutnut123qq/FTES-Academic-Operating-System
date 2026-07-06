"use client"

import React, { useMemo } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import {
    CheckCircleIcon,
    CircleIcon,
    ClockIcon,
    PlayCircleIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { Link, useRouter } from "@/i18n/navigation"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"

/** Build the reader route for a lesson id shaped "m<n>-l<k>". */
const lessonHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/**
 * Learn content dashboard (StarCI port). The full module → lesson tree lives in
 * the layout-owned LEFT content-map rail; this body is the course "home": the
 * header (meta chips), a "Continue learning" CTA + overall progress, and a short
 * "up next" lesson list. No per-feature nav rail or grid — the shell owns the
 * rails now.
 */
export const LearnContentPage = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { modules, header, course, error, mutate } = useQueryLearnCourseSwr(courseId)

    const flatLessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules])
    const upNext = useMemo(() => {
        const firstIncompleteIndex = flatLessons.findIndex((lesson) => !lesson.isCompleted)
        const start = firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex
        return flatLessons.slice(start, start + 6)
    }, [flatLessons])

    const openLesson = (lessonId: string) => router.push(lessonHref(courseId, lessonId))

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <AsyncContent
                isLoading={!header && !error}
                skeleton={<DashboardSkeleton />}
                error={!header ? error : undefined}
                errorContent={{
                    title: t("content.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                {header && course ? (
                    <>
                        <PageHeader
                            title={header.title}
                            meta={(
                                <div className="flex flex-wrap gap-2">
                                    <MetaChip icon={<StackIcon aria-hidden focusable="false" className="size-3" />}>
                                        {t("content.metaModules", { count: header.moduleCount })}
                                    </MetaChip>
                                    <MetaChip icon={<ClockIcon aria-hidden focusable="false" className="size-3" />}>
                                        {t("content.metaHours", { count: header.durationHours })}
                                    </MetaChip>
                                    <MetaChip icon={<UsersIcon aria-hidden focusable="false" className="size-3" />}>
                                        {t("content.metaLearners", { count: header.learnerCount })}
                                    </MetaChip>
                                </div>
                            )}
                        />

                        {/* continue + progress */}
                        <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-4">
                            <Button
                                variant="primary"
                                className="self-start"
                                isDisabled={!header.continueLessonId}
                                onPress={() => header.continueLessonId && openLesson(header.continueLessonId)}
                            >
                                <PlayCircleIcon aria-hidden focusable="false" className="size-5" />
                                {t("content.continue")}
                            </Button>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Typography type="body-sm" color="muted">
                                        {t("content.overallProgress")}
                                    </Typography>
                                    <Typography type="body-sm" weight="semibold">
                                        {t("content.percent", { value: header.progressPercent })}
                                    </Typography>
                                </div>
                                <ProgressMeter value={header.progressPercent} max={100} />
                            </div>
                        </div>

                        {/* up next */}
                        <LabeledCard frameless label={t("content.lessonsTitle")}>
                            <ul className="flex flex-col">
                                {upNext.map((lesson) => (
                                    <li key={lesson.id}>
                                        <Link
                                            href={lessonHref(courseId, lesson.id)}
                                            className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-default/60"
                                        >
                                            {lesson.isCompleted ? (
                                                <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-4 shrink-0 text-accent" />
                                            ) : (
                                                <CircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                                            )}
                                            <Typography type="body-sm" truncate className="min-w-0 flex-1">
                                                {lesson.title}
                                            </Typography>
                                            <Typography type="body-xs" color="muted" className="shrink-0">
                                                {lesson.readTimeLabel}
                                            </Typography>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </LabeledCard>
                    </>
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** A meta chip (icon + label) for the course header. */
const MetaChip = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <Chip size="sm" variant="soft">
        <span className="flex items-center gap-1">
            {icon}
            {children}
        </span>
    </Chip>
)

/** Dashboard skeleton — header + continue card + up-next list. */
const DashboardSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-2/3 rounded-large" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton.Paragraph lines={5} />
    </div>
)
