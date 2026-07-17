"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import { fetchCourseRollup, selectQuestionsPage, type RollupLesson } from "./rollup"
import type { CourseQuestionFilter, CourseQuestionsPage } from "./types"

/**
 * Course-wide Q&A roll-up query. Loads the course lesson tree, fans out lesson-comment
 * reads once (keyed on the course + its lessons + viewer), then applies the active
 * filter/search/page client-side over the rolled-up set. The viewer id is part of the
 * fetch key because comments require auth — an anonymous viewer rolls up nothing and
 * must refetch after signing in.
 */
export const useQueryCourseQuestionsSwr = (params: {
    courseId: string
    filter: CourseQuestionFilter
    search: string
    page: number
    currentUserId: string | null
}) => {
    const { courseId, filter, search, page, currentUserId } = params
    const t = useTranslations("learn")
    const { modules, isLoading: treeLoading } = useQueryLearnCourseSwr(courseId)

    // Flatten the tree into roll-up targets (lesson id + learn-shell deep link).
    const lessons = useMemo<Array<RollupLesson>>(
        () =>
            modules.flatMap((module) =>
                module.lessons.map((lesson) => ({
                    lessonId: lesson.id,
                    moduleId: module.id,
                    title: lesson.title,
                    href: `/courses/${courseId}/learn/content/modules/${module.id}/contents/${lesson.id}`,
                })),
            ),
        [modules, courseId],
    )
    const lessonKey = lessons.map((lesson) => lesson.lessonId).join(",")

    const youLabel = t("comments.you")
    const memberLabel = t("comments.member")

    const { data: all, isLoading, isValidating, error, mutate } = useSWR(
        courseId && lessons.length > 0 ? ["COURSE_QA_ROLLUP", courseId, lessonKey, currentUserId] : null,
        () => fetchCourseRollup(lessons, { you: youLabel, member: memberLabel, currentUserId }),
        { revalidateOnFocus: false },
    )

    // Filter/search/page run client-side over the rolled-up set (no refetch on change).
    const data = useMemo<CourseQuestionsPage | undefined>(
        () => (all ? selectQuestionsPage(all, { filter, search, page, currentUserId }) : undefined),
        [all, filter, search, page, currentUserId],
    )

    return {
        data,
        isLoading: isLoading || (treeLoading && !all),
        isValidating,
        error,
        mutate,
    }
}
