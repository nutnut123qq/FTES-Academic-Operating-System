"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button, Tabs, Typography } from "@heroui/react"
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    CheckIcon,
    DownloadSimpleIcon,
    FileTextIcon,
    PlayCircleIcon,
    TargetIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { OutlineRail } from "@/components/blocks/navigation/OutlineRail"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryLessonSwr } from "../hooks/useQueryLessonSwr"

/** The three content tabs below the video. */
type LessonTab = "overview" | "docs" | "notes"
const TABS: Array<LessonTab> = ["overview", "docs", "notes"]

/**
 * Learn player (§4) — the chosen layout (2026-07-02): a collapsible curriculum rail
 * on the left (chapters → lessons with completion + the active lesson highlighted)
 * and a cinema content area on the right (video, tabs, mark-complete, prev/next, and
 * an end-of-chapter challenge callout). The Coursera/Udemy player pattern.
 *
 * The rail is the shared `OutlineRail` block (progress header + search + accordion of
 * `ContentMapRow`s). Premium lessons unlock by ENROLLING the course (rule
 * premium-unlock-is-enroll-not-vip). Feature owns data + routing + i18n + the local
 * UI state (active tab, search, expanded chapters, session mark-complete overlay).
 *
 * ponytail: video is a placeholder; mark-complete is a local overlay (no BE);
 * download/challenge CTAs are no-ops. Mock via `useQueryLessonSwr`.
 */
export const CourseLesson = () => {
    const t = useTranslations("courseSystem")
    const router = useRouter()
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
    const { lesson, outline, progress, course, error, mutate } = useQueryLessonSwr(courseId, lessonId)

    const [tab, setTab] = useState<LessonTab>("overview")
    const [query, setQuery] = useState("")
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    // ponytail: session-only completion overlay — a real BE persists this per user.
    const [marked, setMarked] = useState<Set<string>>(new Set())

    const allLessons = useMemo(() => outline.flatMap((section) => section.lessons), [outline])
    const isRead = (id: string, serverCompleted: boolean) => serverCompleted || marked.has(id)
    const doneCount = allLessons.filter((item) => isRead(item.id, item.isCompleted)).length
    const currentRead = lesson ? isRead(lesson.id, lesson.isCompleted) : false

    // auto-open the chapter holding the active lesson
    useEffect(() => {
        const section = outline.find((s) => s.lessons.some((l) => l.id === lessonId))
        if (section) {
            setExpanded((prev) => (prev.has(section.id) ? prev : new Set(prev).add(section.id)))
        }
    }, [outline, lessonId])

    const goTo = (id: string | null) => {
        if (id) {
            router.push(`/courses/${courseId}/lessons/${id}`)
        }
    }
    const toggleComplete = () =>
        setMarked((prev) => {
            const next = new Set(prev)
            if (next.has(lessonId)) {
                next.delete(lessonId)
            } else {
                next.add(lessonId)
            }
            return next
        })

    const normalizedQuery = query.trim().toLowerCase()
    const groups = outline
        .map((section) => {
            const items = section.lessons
                .filter((l) => normalizedQuery === "" || l.title.toLowerCase().includes(normalizedQuery))
                .map((l) => ({
                    id: l.id,
                    title: l.title,
                    isActive: l.id === lessonId,
                    isRead: isRead(l.id, l.isCompleted),
                    isPremium: l.isPremium,
                    meta: (
                        <Typography type="body-xs" color="muted">
                            {l.durationLabel}
                        </Typography>
                    ),
                    onPress: () => goTo(l.id),
                }))
            const done = section.lessons.filter((l) => isRead(l.id, l.isCompleted)).length
            return {
                id: section.id,
                title: section.title,
                progress: { done, total: section.lessons.length },
                collapsedCountLabel: `${done}/${section.lessons.length}`,
                items,
            }
        })
        .filter((group) => normalizedQuery === "" || group.items.length > 0)

    return (
        <div className="flex w-full flex-col">
            {/* top bar — back, course, overall progress */}
            <div className="flex items-center gap-3 border-b border-separator p-4">
                <Button
                    variant="ghost"
                    isIconOnly
                    aria-label={t("lesson.previous")}
                    onPress={() => router.push(`/courses/${courseId}`)}
                >
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-5" />
                </Button>
                <Typography type="body-sm" weight="medium" className="min-w-0 truncate">
                    {course ? `${course.code} · ${course.name}` : courseId.toUpperCase()}
                </Typography>
                <div className="ml-auto flex items-center gap-3">
                    <div className="hidden w-32 sm:block">
                        <ProgressMeter value={doneCount} max={progress.total || 1} />
                    </div>
                    <Typography type="body-xs" color="muted">
                        {t("player.count", { done: doneCount, total: progress.total })}
                    </Typography>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
                {/* curriculum rail */}
                <div className="border-b border-separator lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:border-b-0 lg:border-r">
                    <OutlineRail
                        className="h-full"
                        header={{
                            label: t("player.contents"),
                            progress: { done: doneCount, total: progress.total },
                            countLabel: t("player.count", { done: doneCount, total: progress.total }),
                        }}
                        search={{
                            value: query,
                            onChange: setQuery,
                            placeholder: t("player.searchLessons"),
                            ariaLabel: t("player.searchLessons"),
                        }}
                        groups={groups}
                        expandedKeys={expanded}
                        onExpandedChange={setExpanded}
                        async={{
                            isLoading: outline.length === 0 && !error,
                            skeleton: <RailSkeleton />,
                            isEmpty: outline.length === 0,
                            emptyTitle: t("player.empty"),
                            errorTitle: t("player.error"),
                            error: outline.length === 0 ? error : undefined,
                            onRetry: () => { void mutate() },
                            retryLabel: t("detail.retry"),
                            noMatchLabel: t("player.noMatch"),
                        }}
                    />
                </div>

                {/* content area */}
                <div className="min-w-0 p-6">
                    <AsyncContent
                        isLoading={!lesson && !error}
                        skeleton={<ContentSkeleton />}
                        error={!lesson ? error : undefined}
                        errorContent={{
                            title: t("player.error"),
                            onRetry: () => { void mutate() },
                            retryLabel: t("detail.retry"),
                        }}
                    >
                        {lesson ? (
                            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                                <div className="flex aspect-video w-full items-center justify-center rounded-large bg-default/40">
                                    <PlayCircleIcon aria-hidden focusable="false" className="size-12 text-muted" />
                                </div>
                                <Typography type="h5" weight="bold">
                                    {lesson.title}
                                </Typography>

                                <ExtendedTabs selectedKey={tab} onSelectionChange={(key) => setTab(key as LessonTab)}>
                                    <Tabs.ListContainer>
                                        <Tabs.List aria-label={t("player.contents")}>
                                            {TABS.map((key) => (
                                                <Tabs.Tab key={key} id={key}>
                                                    {t(`player.tabs.${key}`)}
                                                </Tabs.Tab>
                                            ))}
                                        </Tabs.List>
                                    </Tabs.ListContainer>
                                </ExtendedTabs>

                                {tab === "overview" ? (
                                    <Typography type="body-sm" color="muted">
                                        {lesson.overview}
                                    </Typography>
                                ) : null}
                                {tab === "docs" ? (
                                    <div className="flex flex-col gap-3">
                                        {lesson.docs.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center gap-3 rounded-large border border-separator p-4"
                                            >
                                                <FileTextIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                                                <div className="min-w-0 flex-1">
                                                    <Typography type="body-sm" weight="medium" truncate>
                                                        {doc.title}
                                                    </Typography>
                                                    <Typography type="body-xs" color="muted">
                                                        {doc.sizeLabel}
                                                    </Typography>
                                                </div>
                                                <Button variant="ghost" isIconOnly aria-label={t("player.download")}>
                                                    <DownloadSimpleIcon aria-hidden focusable="false" className="size-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                                {tab === "notes" ? (
                                    <Typography type="body-sm" color="muted">
                                        {t("player.notesPlaceholder")}
                                    </Typography>
                                ) : null}

                                {/* end-of-chapter challenge */}
                                {lesson.challenge ? (
                                    <div className="flex items-center gap-3 rounded-large bg-accent/10 p-4">
                                        <TargetIcon aria-hidden focusable="false" className="size-6 shrink-0 text-accent" />
                                        <div className="min-w-0 flex-1">
                                            <Typography type="body-sm" weight="medium" className="text-accent">
                                                {t("player.challengeTitle")}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {lesson.challenge.title} · {t("player.challengeMeta", { count: lesson.challenge.questionCount })}
                                            </Typography>
                                        </div>
                                        <Button
                                            variant="primary"
                                            onPress={() => router.push(`/courses/${courseId}/quiz`)}
                                        >
                                            {t("player.challengeCta")}
                                        </Button>
                                    </div>
                                ) : null}

                                {/* footer — prev / mark-complete / next */}
                                <div className="flex flex-wrap items-center gap-3 border-t border-separator pt-6">
                                    <Button
                                        variant="ghost"
                                        isDisabled={!lesson.prevId}
                                        onPress={() => goTo(lesson.prevId)}
                                    >
                                        <ArrowLeftIcon aria-hidden focusable="false" className="size-5" />
                                        {t("lesson.previous")}
                                    </Button>
                                    <Button variant="secondary" className="ml-auto" onPress={toggleComplete}>
                                        {currentRead ? (
                                            <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-5 text-accent" />
                                        ) : (
                                            <CheckIcon aria-hidden focusable="false" className="size-5" />
                                        )}
                                        {currentRead ? t("player.completed") : t("player.markComplete")}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        isDisabled={!lesson.nextId}
                                        onPress={() => goTo(lesson.nextId)}
                                    >
                                        {t("lesson.next")}
                                        <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </AsyncContent>
                </div>
            </div>
        </div>
    )
}

/** Rail skeleton — a few grouped rows. */
const RailSkeleton = () => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
    </div>
)

/** Content skeleton — mirrors the video + title + tabs + body. */
const ContentSkeleton = () => (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="aspect-video w-full rounded-large" />
        <Skeleton className="h-7 w-1/2 rounded-large" />
        <Skeleton className="h-8 w-64 rounded-large" />
        <Skeleton.Paragraph lines={3} />
    </div>
)
