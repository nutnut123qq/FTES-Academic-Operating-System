"use client"

import useSWR from "swr"

/** One lesson (content) inside a module. */
export interface LearnLesson {
    id: string
    title: string
    /** Estimated read/watch time, e.g. "6 min". */
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

/** The full learn shape for a course (§4, mock until BE lands). */
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

/** A deterministic module/lesson tree so every view renders from one shape. */
const buildModules = (): Array<LearnModule> => {
    const titles = [
        "Getting started",
        "Variables & types",
        "Control flow",
        "Functions & scope",
        "Collections",
        "Error handling",
        "Modules & packages",
        "Async foundations",
        "Testing basics",
        "Working with APIs",
        "Data modeling",
        "Persistence & DB",
        "Auth & sessions",
        "Caching",
        "Background jobs",
        "Observability",
        "Performance",
        "Security essentials",
        "Deployment",
        "Scaling patterns",
        "Capstone",
    ]
    return titles.map((title, moduleIndex) => {
        const order = moduleIndex + 1
        const lessonCount = 4
        const lessons: Array<LearnLesson> = Array.from({ length: lessonCount }).map((_, lessonIndex) => {
            // First module fully done; module 2 half done; the rest untouched.
            const isCompleted = order === 1 || (order === 2 && lessonIndex < 2)
            return {
                id: `m${order}-l${lessonIndex + 1}`,
                title: `${title} · part ${lessonIndex + 1}`,
                readTimeLabel: `${5 + ((moduleIndex + lessonIndex) % 8)} min`,
                isCompleted,
                isPremium: order > 2 && lessonIndex === lessonCount - 1,
                hasChallenge: lessonIndex === lessonCount - 1,
            }
        })
        return { id: `m${order}`, order, title, lessons }
    })
}

const fetchLearnCourseMock = async (courseId: string): Promise<LearnCourse> => {
    const modules = buildModules()
    const flat = modules.flatMap((module) => module.lessons)
    const done = flat.filter((lesson) => lesson.isCompleted).length
    const firstIncomplete = flat.find((lesson) => !lesson.isCompleted) ?? null
    return {
        id: courseId,
        header: {
            title: "Fullstack Mastery",
            moduleCount: modules.length,
            durationHours: 42,
            learnerCount: 1280,
            progressPercent: Math.round((done / flat.length) * 100),
            continueLessonId: firstIncomplete?.id ?? null,
        },
        navSections: NAV_SECTIONS,
        modules,
    }
}

/** Loads the whole learn tree for a course. Mocked; SWR-shaped for a BE swap. */
export const useQueryLearnCourseSwr = (courseId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["learn-course", courseId],
        () => fetchLearnCourseMock(courseId),
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
