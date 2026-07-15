"use client"

import React, { useMemo, useState } from "react"
import { Accordion, Button, Chip, Label, ScrollShadow, Typography, cn } from "@heroui/react"
import {
    ArrowRightIcon,
    CheckCircleIcon,
    LockSimpleIcon,
    PlayCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { useRouter } from "@/i18n/navigation"
import { mutate as globalMutate } from "swr"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import type { LearnLesson } from "../hooks/useQueryLearnCourseSwr"

/** Build the reader route for a lesson id shaped "m<n>-l<k>". */
const lessonHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/** Props for {@link ContentMap}. */
export interface ContentMapProps {
    /** Extra classes on the rail body (the layout owns the sticky/width chrome). */
    className?: string
}

/**
 * Persistent LEFT course content-map rail (StarCI port). The full module → lesson
 * tree lives here as its single home: overall progress + a search box + per-module
 * accordions, each lesson a row that links to its reader and marks the active
 * lesson. Pins its header + search, scrolling only the list.
 */
export const ContentMap = ({ className }: ContentMapProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId, contentId } = useParams<{ courseId: string; contentId?: string }>()
    const { course, modules, header, error, mutate } = useQueryLearnCourseSwr(courseId)

    const [query, setQuery] = useState("")

    const flatLessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules])
    const doneCount = flatLessons.filter((lesson) => lesson.isCompleted).length
    const totalCount = flatLessons.length

    // the module owning the active lesson opens by default
    const activeModuleId = contentId ? contentId.split("-")[0] : undefined

    const normalized = query.trim().toLowerCase()
    const filteredModules = useMemo(
        () =>
            modules
                .map((module) => ({
                    ...module,
                    lessons: module.lessons.filter(
                        (lesson) => normalized === "" || lesson.title.toLowerCase().includes(normalized),
                    ),
                }))
                // drop sections with no (matching) lessons — an empty "0/0 bài" section is clutter
                .filter((module) => module.lessons.length > 0),
        [modules, normalized],
    )

    const openLesson = (lessonId: string) => router.push(lessonHref(courseId, lessonId))
    const continueLessonId = header?.continueLessonId ?? null

    return (
        <div className={cn("flex min-h-0 flex-col gap-4 p-4", className)}>
            {/* pinned header: title + overall progress + search */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <Label>{t("contentMap.title")}</Label>
                    <Typography type="body-xs" color="muted" className="shrink-0">
                        {t("content.progressCount", { done: doneCount, total: totalCount })}
                    </Typography>
                </div>
                <ProgressMeter value={doneCount} max={totalCount || 1} />
                {continueLessonId ? (
                    <Button
                        size="sm"
                        variant="primary"
                        className="w-full"
                        onPress={() => openLesson(continueLessonId)}
                    >
                        <span className="flex items-center gap-1">
                            {t("content.continue")}
                            <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                        </span>
                    </Button>
                ) : null}
                <SearchInput
                    value={query}
                    onValueChange={setQuery}
                    variant="secondary"
                    placeholder={t("contentMap.searchPlaceholder")}
                    className="sm:max-w-none"
                />
            </div>

            {/* the tree scrolls; header above stays pinned */}
            <ScrollShadow hideScrollBar className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <AsyncContent
                    isLoading={modules.length === 0 && !error}
                    skeleton={<ContentMapSkeleton />}
                    isEmpty={filteredModules.length === 0}
                    emptyContent={{
                        title: normalized ? t("contentMap.noMatch") : t("contentMap.empty"),
                    }}
                    error={modules.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("content.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    <Accordion
                        variant="surface"
                        className="overflow-hidden border border-default"
                        defaultExpandedKeys={activeModuleId ? [activeModuleId] : undefined}
                    >
                        {filteredModules.map((module) => (
                            <Accordion.Item key={module.id} id={module.id} aria-label={module.title}>
                                <Accordion.Heading>
                                    <Accordion.Trigger className="text-sm font-semibold">
                                        <div className="flex w-full min-w-0 items-center gap-2">
                                            <div className="min-w-0 flex-1 text-left">
                                                <Typography type="body-sm" weight="semibold" truncate>
                                                    {module.title}
                                                </Typography>
                                                {module.description ? (
                                                    <Typography type="body-xs" color="muted" className="line-clamp-1">
                                                        {module.description}
                                                    </Typography>
                                                ) : null}
                                            </div>
                                            <Chip size="sm" variant="soft" className="shrink-0">
                                                {t("contentMap.lessonCount", {
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
                                        <div className="flex flex-col gap-1">
                                            {module.lessons.map((lesson) => (
                                                <ContentMapLessonRow
                                                    key={lesson.id}
                                                    courseId={courseId}
                                                    courseRawId={course?.id}
                                                    courseTitle={course?.header.title ?? ""}
                                                    lesson={lesson}
                                                    isActive={lesson.id === contentId}
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
            </ScrollShadow>
        </div>
    )
}

/** One lesson row — status icon, title, preview/lock badge, active tint. */
const ContentMapLessonRow = ({
    courseId,
    courseRawId,
    courseTitle,
    lesson,
    isActive,
    onOpen,
    lockedLabel,
}: {
    courseId: string
    courseRawId: string | undefined
    courseTitle: string
    lesson: LearnLesson
    isActive: boolean
    onOpen: () => void
    lockedLabel: string
}) => {
    const t = useTranslations("learn")
    const [gateOpen, setGateOpen] = useState(false)

    const accessLevel = lesson.accessLevel
    const isLocked = lesson.isLocked
    const isPreview = accessLevel === "PREVIEW"
    const isFullyLocked = accessLevel === "NONE"

    const handleClick = () => {
        if (isFullyLocked) {
            setGateOpen(true)
            return
        }
        onOpen()
    }

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                    isActive ? "bg-accent/10 text-accent" : "hover:bg-default/60",
                )}
            >
                {lesson.isCompleted ? (
                    <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-4 shrink-0 text-accent" />
                ) : isFullyLocked ? (
                    <LockSimpleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                ) : (
                    <PlayCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                )}
                <div className="min-w-0 flex-1">
                    <Typography type="body-sm" truncate>
                        {lesson.title}
                    </Typography>
                    {lesson.description ? (
                        <Typography type="body-xs" color="muted" className="line-clamp-1 opacity-70">
                            {lesson.description}
                        </Typography>
                    ) : null}
                </div>
                {isPreview ? (
                    <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                        {t("content.previewBadge")}
                    </Chip>
                ) : isLocked ? (
                    <Chip size="sm" variant="soft" color="warning" className="shrink-0">
                        <span className="flex items-center gap-1">
                            <LockSimpleIcon aria-hidden focusable="false" className="size-3" />
                            {lockedLabel}
                        </span>
                    </Chip>
                ) : (
                    <Typography type="body-xs" color="muted" className="shrink-0">
                        {lesson.readTimeLabel}
                    </Typography>
                )}
            </button>
            {courseRawId && isFullyLocked ? (
                <PackageGateModal
                    isOpen={gateOpen}
                    onClose={() => setGateOpen(false)}
                    courseId={courseId}
                    courseRawId={courseRawId}
                    courseTitle={courseTitle}
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    packageSlugs={lesson.packageSlugs}
                    context="document"
                    onPurchased={() => { void revalidateLearnData(courseId) }}
                />
            ) : null}
        </>
    )
}

/** Revalidates the learn course + lesson queries after a purchase from the outline. */
const revalidateLearnData = async (courseId: string) => {
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_LEARN_COURSE" && key[1] === courseId)
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_LEARN_LESSON")
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_COURSE_PROGRESS")
}

/** Content-map skeleton — mirrors a few accordion rows. */
const ContentMapSkeleton = () => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-2xl" />
        ))}
    </div>
)
