"use client"

import React, {
    useMemo,
} from "react"
import {
    Accordion,
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    CheckCircleIcon,
    CircleIcon,
    LockIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useSelectedCourse,
} from "../hooks/useSelectedCourse"
import {
    isAttempted,
    toDifficulty,
    toStatusTone,
} from "./map"
import { useQueryMyCourseOutlineSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCourseOutlineSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { DifficultyChip } from "@/components/blocks/chips/DifficultyChip"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { fromGlobalId } from "@/modules/utils/globalId"
import type { MyCourseOutlineModule, MyCourseOutlinePayload } from "@/modules/api/graphql/queries/types/my-course-outline"

/** Props for {@link CourseOutline}. */
export interface CourseOutlineProps extends WithClassNames<undefined> {
    /**
     * Lower-cased trimmed search query. Modules are kept when their title matches
     * or any of their lessons match; their lesson list is filtered to matches.
     */
    search?: string
}

/** Number of placeholder accordion modules shown while the outline loads. */
const SKELETON_MODULE_COUNT = 4

/**
 * Accordion-card skin shared by the Contents + Personal Project tabs: HeroUI's
 * `variant="surface"` bakes the card fill (`bg-surface`) + rounded-3xl + item
 * separators, so here we only add the card border (the surface variant has none).
 * Surface reads as a real card on the settings page's `bg-background`.
 */
const ACCORDION_CARD = "overflow-hidden border border-default"

/** Skeleton frame that mirrors the surface accordion-card (bg-surface + rounded + border). */
const ACCORDION_CARD_SKELETON = "flex flex-col rounded-3xl border border-default bg-surface"

/**
 * Filter modules + their lessons by a search query. A module survives when its
 * own title matches OR it has at least one matching lesson; surviving modules keep
 * only their matching lessons (or all of them when the module title itself
 * matched). Empty query → unchanged.
 *
 * @param modules - The course's modules.
 * @param query - Lower-cased trimmed search query.
 * @returns The filtered modules.
 */
const filterModules = (
    modules: Array<MyCourseOutlineModule>,
    query: string,
): Array<MyCourseOutlineModule> => {
    if (!query) {
        return modules
    }
    const result: Array<MyCourseOutlineModule> = []
    for (const module of modules) {
        const moduleMatches = module.title.toLowerCase().includes(query)
        const lessons = moduleMatches
            ? module.lessons
            : module.lessons.filter((lesson) => lesson.title.toLowerCase().includes(query))
        if (moduleMatches || lessons.length > 0) {
            result.push({ ...module, lessons })
        }
    }
    return result
}

/**
 * The id of the module that should open by default — the one holding the viewer's
 * next content task (next unread lesson / first uncompleted challenge), so the
 * accordion lands on "where you are". Null when there is no resume pointer.
 *
 * @param outline - The course outline payload.
 * @returns The module id to expand, or null.
 */
const resolveOpenModuleId = (outline: MyCourseOutlinePayload): string | null => {
    const pointer = outline.nextContentTask ?? outline.currentTask
    if (!pointer) {
        return null
    }
    for (const module of outline.modules) {
        const hit = module.lessons.some(
            (lesson) => lesson.id === pointer.id
                || lesson.challenges.some((challenge) => challenge.id === pointer.id),
        )
        if (hit) {
            return module.id
        }
    }
    return null
}

/**
 * Course "Contents" tab: the curriculum of ONE enrolled course as a
 * module → lesson → challenge accordion-card (read flags + challenge progress
 * overlaid), filtered by the shared `search`. The module containing the viewer's
 * next content task opens by default. Owns no header / back link / overall
 * progress — its parent ({@link import("../CourseDetail").CourseDetail}) does.
 *
 * @param props - {@link CourseOutlineProps}
 */
export const CourseOutline = ({
    search = "",
    className,
}: CourseOutlineProps) => {
    const t = useTranslations()
    const { selectedCourse } = useSelectedCourse()

    // decode the selected course globalId (CourseEntity:<id>) → raw id for the query
    const rawCourseId = selectedCourse ? fromGlobalId(selectedCourse)?.id ?? null : null
    const outlineSwr = useQueryMyCourseOutlineSwr(rawCourseId)
    const outline = outlineSwr.data

    const query = search.trim().toLowerCase()
    const modules = useMemo(
        () => (outline ? filterModules(outline.modules, query) : []),
        [outline, query],
    )
    // default-open the module holding the resume pointer (only when not searching)
    const defaultOpenId = useMemo(
        () => (outline && !query ? resolveOpenModuleId(outline) : null),
        [outline, query],
    )

    return (
        <AsyncContent
            isLoading={outlineSwr.data === null || outlineSwr.data === undefined ? !outlineSwr.error : false}
            skeleton={(
                <div className={cn(ACCORDION_CARD_SKELETON, className)}>
                    {Array.from({ length: SKELETON_MODULE_COUNT }).map((_unused, moduleIndex) => (
                        <div key={moduleIndex} className="flex items-center justify-between gap-3 border-b border-default p-4 last:border-b-0">
                            <Skeleton.Typography type="body" width="1/2" />
                            <Skeleton className="h-4 w-16 rounded-medium" />
                        </div>
                    ))}
                </div>
            )}
            isEmpty={!outline}
            emptyContent={{ title: t("profileSettings.learning.outline.empty") }}
            error={!outlineSwr.data ? outlineSwr.error : undefined}
            errorContent={{
                title: t("profileSettings.learning.outline.error"),
                onRetry: () => { void outlineSwr.mutate() },
                retryLabel: t("profileSettings.learning.loadMore"),
            }}
        >
            {modules.length === 0 ? (
                <EmptyContent title={t("profileSettings.learning.outline.noMatch")} />
            ) : (
                <Accordion
                    variant="surface"
                    className={cn(ACCORDION_CARD, className)}
                    defaultExpandedKeys={defaultOpenId ? [defaultOpenId] : undefined}
                >
                    {modules.map((module) => {
                        const read = module.lessons.filter((lesson) => lesson.isRead).length
                        const total = module.lessons.length
                        const allRead = total > 0 && read === total
                        return (
                            <Accordion.Item key={module.id} aria-label={module.title}>
                                <Accordion.Heading>
                                    <Accordion.Trigger>
                                        <div className="flex w-full items-center justify-between gap-3 text-start">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Typography type="body" weight="semibold" truncate>
                                                    {module.title}
                                                </Typography>
                                                {module.isPremium ? (
                                                    <LockIcon
                                                        aria-label={t("profileSettings.learning.outline.premium")}
                                                        focusable="false"
                                                        className="size-5 shrink-0 text-muted"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {allRead ? (
                                                    <Typography type="body-xs" className="text-success">
                                                        {t("profileSettings.learning.outline.readCount", { read, total })}
                                                    </Typography>
                                                ) : (
                                                    <Typography type="body-xs" color="muted">
                                                        {t("profileSettings.learning.outline.readCount", { read, total })}
                                                    </Typography>
                                                )}
                                                <Accordion.Indicator />
                                            </div>
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Heading>
                                <Accordion.Panel>
                                    <Accordion.Body>
                                        <div className="flex flex-col gap-2">
                                            {module.lessons.map((lesson) => (
                                                <div key={lesson.id} className="flex flex-col gap-2">
                                                    <ListRow
                                                        title={lesson.title}
                                                        subtitle={t("content.minutesRead", { minutes: lesson.minutesRead })}
                                                        meta={(
                                                            <>
                                                                {lesson.difficulty ? (
                                                                    <DifficultyChip difficulty={toDifficulty(lesson.difficulty)} />
                                                                ) : null}
                                                                {lesson.isPremium ? (
                                                                    <LockIcon
                                                                        aria-label={t("profileSettings.learning.outline.premium")}
                                                                        focusable="false"
                                                                        className="size-5 text-muted"
                                                                    />
                                                                ) : null}
                                                                {lesson.isRead ? (
                                                                    <CheckCircleIcon
                                                                        aria-label={t("profileSettings.learning.outline.read")}
                                                                        focusable="false"
                                                                        className="size-5 text-success"
                                                                    />
                                                                ) : (
                                                                    <CircleIcon
                                                                        aria-label={t("profileSettings.learning.outline.unread")}
                                                                        focusable="false"
                                                                        className="size-5 text-muted"
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    />
                                                    {lesson.challenges.length > 0 ? (
                                                        <div className="flex flex-col gap-2 pl-6">
                                                            {lesson.challenges.map((challenge) => (
                                                                <ListRow
                                                                    key={challenge.id}
                                                                    leading={(
                                                                        <PuzzlePieceIcon aria-hidden focusable="false" className="size-5 text-muted" />
                                                                    )}
                                                                    title={challenge.title}
                                                                    meta={(
                                                                        <>
                                                                            <DifficultyChip difficulty={toDifficulty(challenge.difficulty)} />
                                                                            <StatusChip tone={toStatusTone(challenge.status)}>
                                                                                {t(`profileSettings.learning.outline.status.${challenge.status}`)}
                                                                            </StatusChip>
                                                                            {isAttempted(challenge.status) ? (
                                                                                <Typography type="body-xs" color="muted">
                                                                                    {`${challenge.lastScore}/${challenge.maxScore}`}
                                                                                </Typography>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Panel>
                            </Accordion.Item>
                        )
                    })}
                </Accordion>
            )}
        </AsyncContent>
    )
}
