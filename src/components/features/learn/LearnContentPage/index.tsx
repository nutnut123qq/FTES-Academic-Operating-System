"use client"

import React, { useMemo, useState } from "react"
import { Accordion, Button, Chip, Typography } from "@heroui/react"
import {
    CheckCircleIcon,
    CircleIcon,
    ClockIcon,
    LockSimpleIcon,
    PlayCircleIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { Link, useRouter } from "@/i18n/navigation"
import { LearnNavRail } from "../shared/LearnNavRail"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import type { LearnLesson } from "../hooks/useQueryLearnCourseSwr"

/** Build the reader route for a lesson id shaped "m<n>-l<k>". */
const lessonHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/**
 * Learn 3-column content page (priority 1). LEFT = the course nav rail
 * (Mind map / Modules / Foundations / …); MIDDLE = the module list with overall
 * progress, a search box and per-module accordions ("0/4 lessons"); RIGHT = the
 * course header (meta chips, "Continue learning", a progress bar and a flat
 * lesson list with read-times).
 *
 * Feature owns data (`useQueryLearnCourseSwr`) + routing + i18n + local search
 * state. Premium lessons unlock by enrolling (rule premium-unlock-is-enroll).
 */
export const LearnContentPage = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { course, modules, header, navSections, error, mutate } = useQueryLearnCourseSwr(courseId)

    const [query, setQuery] = useState("")

    const flatLessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules])
    const doneCount = flatLessons.filter((lesson) => lesson.isCompleted).length
    const totalCount = flatLessons.length

    const normalized = query.trim().toLowerCase()
    const filteredModules = useMemo(
        () =>
            modules
                .map((module) => ({
                    ...module,
                    lessons: module.lessons.filter(
                        (lesson) =>
                            normalized === "" || lesson.title.toLowerCase().includes(normalized),
                    ),
                }))
                .filter((module) => normalized === "" || module.lessons.length > 0),
        [modules, normalized],
    )

    const openLesson = (lessonId: string) => router.push(lessonHref(courseId, lessonId))

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_340px]">
            {/* LEFT — course nav rail */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
                <LearnNavRail courseId={courseId} sections={navSections} activeKey="content" />
            </aside>

            {/* MIDDLE — module list */}
            <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <Typography type="h6" weight="bold">
                            {t("content.modulesTitle")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("content.progressCount", { done: doneCount, total: totalCount })}
                        </Typography>
                    </div>
                    <ProgressMeter value={doneCount} max={totalCount || 1} />
                    <SearchInput
                        value={query}
                        onValueChange={setQuery}
                        variant="secondary"
                        placeholder={t("content.searchPlaceholder")}
                        className="sm:max-w-none"
                    />
                </div>

                <AsyncContent
                    isLoading={modules.length === 0 && !error}
                    skeleton={<ModuleListSkeleton />}
                    isEmpty={filteredModules.length === 0}
                    emptyContent={{
                        title: normalized ? t("content.noMatch") : t("content.empty"),
                    }}
                    error={modules.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("content.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    <Accordion variant="surface" className="overflow-hidden border border-default">
                        {filteredModules.map((module) => (
                            <Accordion.Item key={module.id} id={module.id} aria-label={module.title}>
                                <Accordion.Heading>
                                    <Accordion.Trigger className="text-base font-semibold">
                                        <div className="flex w-full min-w-0 items-center gap-2">
                                            <Typography
                                                type="body"
                                                weight="semibold"
                                                truncate
                                                className="min-w-0 flex-1 text-left"
                                            >
                                                {t("content.moduleLabel", {
                                                    order: module.order,
                                                    title: module.title,
                                                })}
                                            </Typography>
                                            <Chip size="sm" variant="soft" className="shrink-0">
                                                {t("content.lessonCount", {
                                                    done: module.lessons.filter((lesson) => lesson.isCompleted).length,
                                                    total: module.lessons.length,
                                                })}
                                            </Chip>
                                            <Accordion.Indicator className="shrink-0" />
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Heading>
                                <Accordion.Panel>
                                    <Accordion.Body>
                                        <div className="flex flex-col gap-2">
                                            {module.lessons.map((lesson) => (
                                                <ModuleLessonRow
                                                    key={lesson.id}
                                                    lesson={lesson}
                                                    onOpen={() => openLesson(lesson.id)}
                                                    lockedLabel={t("content.premium")}
                                                />
                                            ))}
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </AsyncContent>
            </div>

            {/* RIGHT — course header */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
                <AsyncContent
                    isLoading={!header && !error}
                    skeleton={<HeaderSkeleton />}
                    error={!header ? error : undefined}
                    errorContent={{
                        title: t("content.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    {header && course ? (
                        <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-4">
                            <PageHeader
                                title={header.title}
                                meta={
                                    <div className="flex flex-wrap gap-2">
                                        <MetaChip icon={<StackIcon aria-hidden focusable="false" className="size-4" />}>
                                            {t("content.metaModules", { count: header.moduleCount })}
                                        </MetaChip>
                                        <MetaChip icon={<ClockIcon aria-hidden focusable="false" className="size-4" />}>
                                            {t("content.metaHours", { count: header.durationHours })}
                                        </MetaChip>
                                        <MetaChip icon={<UsersIcon aria-hidden focusable="false" className="size-4" />}>
                                            {t("content.metaLearners", { count: header.learnerCount })}
                                        </MetaChip>
                                    </div>
                                }
                            />

                            <Button
                                variant="primary"
                                isDisabled={!header.continueLessonId}
                                onPress={() =>
                                    header.continueLessonId && openLesson(header.continueLessonId)
                                }
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

                            <div className="flex flex-col gap-2">
                                <Typography type="body-sm" weight="semibold">
                                    {t("content.lessonsTitle")}
                                </Typography>
                                <ul className="flex flex-col">
                                    {flatLessons.slice(0, 6).map((lesson) => (
                                        <li key={lesson.id}>
                                            <Link
                                                href={lessonHref(courseId, lesson.id)}
                                                className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-default/60"
                                            >
                                                {lesson.isCompleted ? (
                                                    <CheckCircleIcon
                                                        aria-hidden
                                                        focusable="false"
                                                        weight="fill"
                                                        className="size-4 shrink-0 text-accent"
                                                    />
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
                            </div>
                        </div>
                    ) : null}
                </AsyncContent>
            </aside>
        </div>
    )
}

/** One lesson row in a module accordion — status icon, title, meta, chevron. */
const ModuleLessonRow = ({
    lesson,
    onOpen,
    lockedLabel,
}: {
    lesson: LearnLesson
    onOpen: () => void
    lockedLabel: string
}) => (
    <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-default/60"
    >
        {lesson.isCompleted ? (
            <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-5 shrink-0 text-accent" />
        ) : (
            <PlayCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
        )}
        <Typography type="body-sm" truncate className="min-w-0 flex-1">
            {lesson.title}
        </Typography>
        {lesson.isPremium ? (
            <Chip size="sm" variant="soft" color="warning" className="shrink-0">
                <span className="flex items-center gap-1">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-3" />
                    {lockedLabel}
                </span>
            </Chip>
        ) : null}
        <Typography type="body-xs" color="muted" className="shrink-0">
            {lesson.readTimeLabel}
        </Typography>
    </button>
)

/** A meta chip (icon + label) for the course header. */
const MetaChip = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <Chip size="sm" variant="soft">
        <span className="flex items-center gap-1">
            {icon}
            {children}
        </span>
    </Chip>
)

/** Module list skeleton — a few accordion rows. */
const ModuleListSkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-3xl" />
        ))}
    </div>
)

/** Header skeleton — mirrors the right-rail card. */
const HeaderSkeleton = () => (
    <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-4">
        <Skeleton className="h-7 w-2/3 rounded-large" />
        <Skeleton className="h-6 w-full rounded-large" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-3 w-full rounded-large" />
        <Skeleton.Paragraph lines={4} />
    </div>
)
