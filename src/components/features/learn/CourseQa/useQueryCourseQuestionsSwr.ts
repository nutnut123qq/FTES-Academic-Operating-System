"use client"

import useSWR from "swr"
import { fetchCourseQuestions } from "./mock"
import type { CourseQuestionFilter, CourseQuestionsPage } from "./types"

/**
 * SWR query for the course-wide Q&A roll-up (mock-backed). Keyed on the course +
 * filter + debounced search + page + viewer, so changing any of them refetches.
 */
export const useQueryCourseQuestionsSwr = (params: {
    courseId: string
    filter: CourseQuestionFilter
    search: string
    page: number
    currentUserId: string | null
}) => {
    const { courseId, filter, search, page, currentUserId } = params
    return useSWR<CourseQuestionsPage>(
        courseId ? ["COURSE_QUESTIONS", courseId, filter, search, page, currentUserId] : null,
        () => fetchCourseQuestions(params),
    )
}
