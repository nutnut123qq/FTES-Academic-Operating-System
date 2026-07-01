"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    Typography,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    ContentMapSkeleton,
} from "./ContentMapSkeleton"
import { useAppSelector } from "@/redux/hooks"
import { useQueryMyCourseOutlineSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCourseOutlineSwr"
import { OutlineRail } from "@/components/blocks/navigation/OutlineRail"
import type { OutlineRailGroup } from "@/components/blocks/navigation/OutlineRail"
import type { MyCourseOutlineModule } from "@/modules/api/graphql/queries/types/my-course-outline"

/** Props for {@link ContentMap}. */
export type ContentMapProps = WithClassNames<undefined>

/**
 * Filter modules + their lessons by a lower-cased query (module title match keeps
 * all its lessons; otherwise only matching lessons survive). Empty query → unchanged.
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
 * Content-map rail — the lean docs-style course navigation tree shown to the left
 * while reading (module → lesson, read/premium markers, a progress header with a
 * "continue" action). A thin data wrapper: owns the `myCourseOutline` SWR + Redux
 * selection + routing + the controlled search/expand state, and renders the shared
 * {@link OutlineRail} block (which owns the look it shares with the personal-project
 * milestone rail).
 *
 * Positioning (sticky / width / scroll) is supplied by the caller via `className`
 * so the same rail serves the desktop left rail and the mobile drawer.
 *
 * @param props - {@link ContentMap}
 */
export const ContentMap = ({ className }: ContentMapProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const courseId = useAppSelector((state) => state.course.id)
    const displayId = useAppSelector((state) => state.course.displayId)
    const activeContentId = useAppSelector((state) => state.content.id)

    const outlineSwr = useQueryMyCourseOutlineSwr(courseId ?? null)
    const outline = outlineSwr.data

    const [search, setSearch] = useState("")
    const query = search.trim().toLowerCase()
    const modules = useMemo(
        () => (outline ? filterModules(outline.modules, query) : []),
        [outline, query],
    )

    /** Module owning the active lesson — expanded on first paint. */
    const activeModuleId = useMemo(() => {
        if (!outline || !activeContentId) {
            return undefined
        }
        return outline.modules.find((module) =>
            module.lessons.some((lesson) => lesson.id === activeContentId))?.id
    }, [outline, activeContentId])

    /**
     * Expanded modules (controlled) — only the open module shows its read-progress
     * bar; collapsed ones show a compact "n/m" count instead. The active lesson's
     * module auto-opens; a search opens every matching module so hits are visible.
     */
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
    useEffect(() => {
        if (!activeModuleId) {
            return
        }
        setExpandedKeys((prev) => prev.has(activeModuleId) ? prev : new Set(prev).add(activeModuleId))
    }, [activeModuleId])
    useEffect(() => {
        if (query) {
            setExpandedKeys(new Set(modules.map((module) => module.id)))
        }
    }, [query, modules])

    const progress = outline?.progress
    const currentTask = outline?.currentTask

    /**
     * Route for the "continue" button from `currentTask`. Lessons route straight to
     * their content; challenges route to the owning lesson's challenges tab. Milestone
     * tasks have no rail route yet → null (button hidden).
     */
    const continueHref = useMemo(() => {
        if (!outline || !currentTask || !displayId) {
            return null
        }
        const base = (moduleId: string, contentId: string) =>
            pathConfig().locale(locale).course(displayId).learn().module(moduleId).content(contentId).build()
        if (currentTask.kind === "lesson") {
            const owner = outline.modules.find((module) =>
                module.lessons.some((lesson) => lesson.id === currentTask.id))
            return owner ? base(owner.id, currentTask.id) : null
        }
        if (currentTask.kind === "challenge") {
            for (const module of outline.modules) {
                const lesson = module.lessons.find((item) =>
                    item.challenges.some((challenge) => challenge.id === currentTask.id))
                if (lesson) {
                    return `${base(module.id, lesson.id)}?tab=challenges`
                }
            }
        }
        return null
    }, [outline, currentTask, displayId, locale])

    /** Jump to the viewer's current task. */
    const onContinue = useCallback(() => {
        if (continueHref) {
            router.push(continueHref)
        }
    }, [continueHref, router])

    /** Navigate to the chosen lesson within its module. */
    const onSelectLesson = useCallback(
        (lessonId: string, moduleId: string) => {
            if (!displayId) {
                return
            }
            router.push(
                pathConfig().locale(locale).course(displayId).learn().module(moduleId).content(lessonId).build(),
            )
        },
        [router, locale, displayId],
    )

    /** modules → milestone-agnostic rail groups (read markers, minutes meta). */
    const groups = useMemo<Array<OutlineRailGroup>>(
        () => modules.map((module) => {
            const readCount = module.lessons.filter((lesson) => lesson.isRead).length
            return {
                id: module.id,
                title: module.title,
                progress: { done: readCount, total: module.lessons.length },
                collapsedCountLabel: t("courseContents.moduleLessons", {
                    read: readCount,
                    total: module.lessons.length,
                }),
                items: module.lessons.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    isActive: lesson.id === activeContentId,
                    isRead: lesson.isRead,
                    isPremium: lesson.isPremium,
                    meta: (
                        <Typography type="body-xs" color="muted">
                            {t("content.minutesShort", { minutes: lesson.minutesRead })}
                        </Typography>
                    ),
                    onPress: () => onSelectLesson(lesson.id, module.id),
                })),
            }
        }),
        [modules, activeContentId, onSelectLesson, t],
    )

    return (
        <OutlineRail
            className={className}
            header={progress ? {
                label: t("courseContents.progress"),
                progress: { done: progress.lessonsRead, total: progress.lessonsTotal },
                countLabel: t("courseContents.contentCount", {
                    read: progress.lessonsRead,
                    total: progress.lessonsTotal,
                }),
                // only when you've navigated AWAY from your current task — hide it while
                // you're already reading that task (the button would just point at this page).
                continue: continueHref && currentTask?.id !== activeContentId ? {
                    label: t("courseContents.resume"),
                    onPress: onContinue,
                } : undefined,
            } : undefined}
            search={{
                value: search,
                onChange: setSearch,
                placeholder: t("courseContents.searchPlaceholder"),
                ariaLabel: t("courseContents.searchAria"),
            }}
            groups={groups}
            expandedKeys={expandedKeys}
            onExpandedChange={setExpandedKeys}
            async={{
                isLoading: !outlineSwr.data && !outlineSwr.error,
                skeleton: <ContentMapSkeleton />,
                isEmpty: !outline,
                emptyTitle: t("courseContents.empty"),
                errorTitle: t("courseContents.error"),
                error: !outlineSwr.data ? outlineSwr.error : undefined,
                onRetry: () => { void outlineSwr.mutate() },
                retryLabel: t("courseContents.retry"),
                noMatchLabel: t("courseContents.noMatch"),
            }}
        />
    )
}

export default ContentMap
