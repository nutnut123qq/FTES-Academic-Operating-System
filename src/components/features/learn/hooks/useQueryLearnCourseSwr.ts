"use client"

import useSWR from "swr"
import { getCourseDetail, type CourseDetail, type LessonView } from "@/modules/api/rest/course"

/** One lesson (content) inside a module. */
export interface LearnLesson {
    id: string
    title: string
    /** One-line lesson blurb (shown under the title in the content-map) — empty when absent. */
    description: string
    /** Estimated read/watch time, e.g. "6 min" — empty when the BE doesn't provide it. */
    readTimeLabel: string
    isCompleted: boolean
    /** Premium lessons unlock by enrolling the course (rule premium-unlock-is-enroll-not-vip). */
    isPremium?: boolean
    /** True when this lesson carries an auto-graded challenge. */
    hasChallenge?: boolean
}

/** One module (chapter) grouping lessons. */
export interface LearnModule {
    id: string
    /** 1-based ordinal shown on the mind map cards. */
    order: number
    title: string
    /** Section blurb (shown under the module title, mirrors the public outline) — empty when absent. */
    description: string
    lessons: Array<LearnLesson>
}

/** A left-rail navigation section (Mind map / Modules / Foundations / Review …). */
export interface LearnNavSection {
    /** Stable key + route segment ("mind-map", "content", …). */
    key: string
    /** Phosphor icon key mapped in the UI. */
    icon: string
}

/** Course header meta shown on the right rail of the content page. */
export interface LearnCourseHeader {
    title: string
    /** Course description (course-home body) — empty when the BE omits it. */
    description: string
    /** Total module count. */
    moduleCount: number
    /** Total learning hours (approx). */
    durationHours: number
    /** Total learners enrolled. */
    learnerCount: number
    /** Percent complete 0–100. */
    progressPercent: number
    /** The lesson to resume ("Continue learning"). */
    continueLessonId: string | null
}

/** The full learn shape for a course (§4). */
export interface LearnCourse {
    id: string
    header: LearnCourseHeader
    navSections: Array<LearnNavSection>
    modules: Array<LearnModule>
}

/** Left-rail sections — order matters (top → bottom). */
const NAV_SECTIONS: Array<LearnNavSection> = [
    { key: "mind-map", icon: "tree" },
    { key: "content", icon: "stack" },
    { key: "foundations", icon: "cube" },
    { key: "review", icon: "cards" },
    { key: "leaderboard", icon: "trophy" },
]

/**
 * Maps a BE lesson to the learn-tree lesson. The public course detail carries no
 * per-viewer progress or reading-time, so `isCompleted`/`readTimeLabel` stay empty
 * (honest defaults — the UI degrades cleanly); `isPremium` reflects the real
 * `free` flag (premium unlocks by enrolling).
 */
const toLearnLesson = (lesson: LessonView): LearnLesson => ({
    id: lesson.id,
    title: lesson.name,
    description: lesson.description ?? "",
    readTimeLabel: "",
    isCompleted: false,
    isPremium: !lesson.free,
    hasChallenge: false,
})

/** Builds the learn tree from the real public course detail (sections → lessons). */
const toLearnCourse = (courseId: string, detail: CourseDetail): LearnCourse => {
    const modules: Array<LearnModule> = (detail.sections ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section, index) => ({
            id: section.id,
            order: index + 1,
            title: section.name,
            description: section.description ?? "",
            lessons: (section.lessons ?? [])
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(toLearnLesson),
        }))
    const firstLessonId = modules.find((m) => m.lessons.length > 0)?.lessons[0]?.id ?? null
    return {
        id: detail.course?.id ?? courseId,
        header: {
            title: detail.course?.title ?? "",
            description: detail.description ?? "",
            moduleCount: modules.length,
            durationHours: 0,
            learnerCount: detail.course?.totalUser ?? 0,
            progressPercent: 0,
            continueLessonId: firstLessonId,
        },
        navSections: NAV_SECTIONS,
        modules,
    }
}

/** Loads the whole learn tree for a course from the real course-detail REST API. */
export const useQueryLearnCourseSwr = (courseId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        courseId ? ["GET_LEARN_COURSE", courseId] : null,
        async () => toLearnCourse(courseId, await getCourseDetail(courseId)),
    )
    return {
        course: data,
        modules: data?.modules ?? [],
        header: data?.header,
        navSections: data?.navSections ?? [],
        isLoading,
        error,
        mutate,
    }
}
