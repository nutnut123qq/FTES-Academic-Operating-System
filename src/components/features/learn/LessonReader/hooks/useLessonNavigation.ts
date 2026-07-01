"use client"

import {
    useMemo,
} from "react"
import {
    useLocale,
} from "next-intl"
import {
    pathConfig,
} from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"
import { useQueryMyCourseOutlineSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCourseOutlineSwr"

/** A neighbouring lesson in the linear course order. */
export interface AdjacentLesson {
    /** In-app route to the lesson's reader. */
    href: string
    /** Lesson title shown on the pager card. */
    title: string
}

/** Result of {@link useLessonNavigation}. */
export interface UseLessonNavigationResult {
    /** 1-based position of the active lesson in the flattened course order (0 when unknown). */
    position: number
    /** Total number of lessons across the course. */
    total: number
    /** The previous lesson, or undefined at the start / when unknown. */
    previous?: AdjacentLesson
    /** The next lesson, or undefined at the end / when unknown. */
    next?: AdjacentLesson
}

/**
 * Linear lesson navigation for the reader: flattens the course outline
 * (`myCourseOutline` modules → lessons, in order), locates the active lesson, and
 * exposes its 1-based position + the previous / next lesson with ready routes.
 *
 * Reads the active course id + lesson id from Redux; the outline SWR is shared
 * (deduped) with the content-map rail. Returns zeros / undefined neighbours while
 * the outline is loading or the lesson is not part of it.
 *
 * @returns {@link UseLessonNavigationResult} position, total, and the neighbours.
 */
export const useLessonNavigation = (): UseLessonNavigationResult => {
    const locale = useLocale()
    const courseId = useAppSelector((state) => state.course.id)
    const displayId = useAppSelector((state) => state.course.displayId)
    const contentId = useAppSelector((state) => state.content.id)
    const outlineSwr = useQueryMyCourseOutlineSwr(courseId ?? null)
    const outline = outlineSwr.data

    return useMemo<UseLessonNavigationResult>(() => {
        if (!outline || !displayId) {
            return { position: 0, total: 0 }
        }
        // flatten modules → lessons into the linear reading order, keeping the
        // owning module id so each lesson route can be rebuilt
        const sequence = outline.modules.flatMap((module) =>
            module.lessons.map((lesson) => ({
                moduleId: module.id,
                contentId: lesson.id,
                title: lesson.title,
            })))
        const total = sequence.length
        const index = sequence.findIndex((entry) => entry.contentId === contentId)
        if (index === -1) {
            return { position: 0, total }
        }

        const toLesson = (entry: typeof sequence[number]): AdjacentLesson => ({
            href: pathConfig().locale(locale).course(displayId).learn()
                .module(entry.moduleId).content(entry.contentId).build(),
            title: entry.title,
        })

        return {
            position: index + 1,
            total,
            previous: index > 0 ? toLesson(sequence[index - 1]) : undefined,
            next: index < total - 1 ? toLesson(sequence[index + 1]) : undefined,
        }
    }, [outline, displayId, locale, contentId])
}
