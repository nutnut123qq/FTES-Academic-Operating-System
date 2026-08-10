"use client"

import useSWR from "swr"
import {
    getCourseDetail,
    getCourseProgress,
    type CourseAccessStateView,
    type CourseDetail,
    type CourseProgressView,
    type LessonView,
} from "@/modules/api/rest/course"
import { useGetMyCourseAccessSwr } from "@/hooks/swr/api/rest/queries/useGetMyCourseAccessSwr"

/** One lesson (content) inside a module. */
export interface LearnLesson {
    id: string
    title: string
    /** One-line lesson blurb (shown under the title in the content-map) — empty when absent. */
    description: string
    /** Estimated read/watch time, e.g. "6 min" — empty when the BE doesn't provide it. */
    readTimeLabel: string
    /**
     * BE lesson content-type (`LessonView.type`), e.g. "VIDEO" | "DOCUMENT". Drives the
     * per-type content-map row glyph ({@link lessonTypeIcon}) so a video row and a document
     * row never share one icon. Empty when the BE omits it → the neutral default glyph.
     */
    contentType: string
    isCompleted: boolean
    /** Premium lessons unlock by enrolling the course (rule premium-unlock-is-enroll-not-vip). */
    isPremium?: boolean
    /**
     * Locked FOR THE CURRENT VIEWER (per-viewer `LessonView.locked`): premium and not
     * yet enrolled. A premium lesson the viewer owns is `isPremium` but NOT `isLocked`,
     * so it must not show a lock marker.
     */
    isLocked: boolean
    /**
     * BE access level for this viewer: "FULL" | "PREVIEW" | "NONE".
     * Mirrors `LessonView.accessLevel` from the curriculum.
     */
    accessLevel: string | null
    /** Slugs of the packages that unlock this lesson (for package-gate filtering). */
    packageSlugs: Array<string>
    /** True when this lesson carries at least one auto-graded challenge. */
    hasChallenge?: boolean
    /**
     * Per-lesson challenges nested as indented child rows under the lesson in the
     * content-map. Empty when the BE curriculum carries none (older deployment, or a
     * lesson with no challenges). (Legacy course-module assignments are no longer
     * surfaced here — the unified challenge path covers them.)
     */
    exercises: Array<LearnExercise>
}

/**
 * One nested exercise under a lesson. `kind` picks the child-row icon and the solver
 * route; `type` is the raw BE challenge type fed to {@link normalizeExerciseType}. The
 * `"assignment"` variant is retained for the mind-map's own node model, but the learn
 * curriculum only ever produces `"challenge"` rows now.
 */
export interface LearnExercise {
    kind: "challenge" | "assignment"
    /** Stable row id (challenge id / assignment id). */
    id: string
    /** Routing id for challenges — the slug the solver route keys on. Absent for assignments. */
    slug?: string
    title: string
    /** Raw BE challenge type (unified downstream); "" for assignments. */
    type: string
    /** Challenge lifecycle status; absent for assignments. */
    status?: string
    /**
     * True when this is a FREE challenge (playable by trial/non-purchase learners on a
     * lesson they can access at FULL). Only meaningful for `kind === "challenge"`; always
     * false for assignments. Sourced from `LessonChallengeSummary.free` (`?? false`).
     */
    free?: boolean
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
    /**
     * The linked subject's code (null when the course has no linked subject). Routes
     * the learn tools rail "Ôn tập" → /subjects/{subjectCode}/practice and "Hỏi đáp"
     * → /subjects/{subjectCode}/discussion.
     */
    subjectCode: string | null
    /** Course cover art (`course.imageHeader`) — empty string when the BE omits it. */
    coverUrl: string
    /** Discounted course price in VND (`course.salePrice`); 0 when free/unknown. */
    priceVnd: number
    /** List (pre-discount) course price in VND (`course.totalPrice`); 0 when unknown. */
    originalVnd: number
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
 * (honest defaults — the UI degrades cleanly). `isPremium` reflects the static `free`
 * flag; `isLocked` reflects the PER-VIEWER `locked` flag so a premium lesson the
 * viewer already owns shows no lock marker (premium unlocks by enrolling).
 */
const toLearnLesson = (lesson: LessonView): LearnLesson => {
    const challenges: Array<LearnExercise> = (lesson.challenges ?? []).map((challenge) => ({
        kind: "challenge",
        id: challenge.id,
        slug: challenge.slug,
        title: challenge.title,
        type: challenge.type,
        status: challenge.status,
        free: challenge.free ?? false,
    }))
    const exercises = challenges
    return {
        id: lesson.id,
        title: lesson.name,
        description: lesson.description ?? "",
        readTimeLabel: "",
        contentType: lesson.type ?? "",
        isCompleted: false,
        isPremium: !lesson.free,
        isLocked: lesson.locked ?? false,
        accessLevel: lesson.accessLevel ?? null,
        packageSlugs: lesson.packageSlugs ?? [],
        // Prefer the real list; fall back to the scalar flag when the BE only sends
        // `hasChallenge` (older curriculum without the `challenges` list).
        hasChallenge: challenges.length > 0 || (lesson.hasChallenge ?? false),
        exercises,
    }
}

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
            // Same public detail as the course page: BE seconds → hours. `null`/absent
            // (nothing measurable) keeps 0, which the header treats as "hide".
            durationHours: detail.totalDurationSeconds
                ? Math.max(1, Math.round(detail.totalDurationSeconds / 3600))
                : 0,
            learnerCount: detail.course?.totalUser ?? 0,
            progressPercent: 0,
            continueLessonId: firstLessonId,
            subjectCode: detail.subjectCode ?? null,
            coverUrl: detail.course?.imageHeader ?? "",
            priceVnd: Number(detail.course?.salePrice ?? 0) || 0,
            originalVnd: Number(detail.course?.totalPrice ?? 0) || 0,
        },
        navSections: NAV_SECTIONS,
        modules,
    }
}

/**
 * Overlays the viewer's progress onto the base tree: marks each COMPLETED lesson,
 * counts done/total for the percent, and resumes at the first incomplete lesson.
 * `progress` is undefined for anon / not-yet-enrolled viewers → tree stays at 0%.
 */
const withProgress = (base: LearnCourse, progress: CourseProgressView | undefined): LearnCourse => {
    const completed = new Set(
        (progress?.lessons ?? []).filter((row) => row.status === "COMPLETED").map((row) => row.lessonId),
    )
    if (completed.size === 0) {
        return base
    }
    let done = 0
    let total = 0
    let resumeId: string | null = null
    const modules = base.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => {
            const isCompleted = completed.has(lesson.id)
            total += 1
            if (isCompleted) done += 1
            else if (resumeId === null) resumeId = lesson.id
            return { ...lesson, isCompleted }
        }),
    }))
    return {
        ...base,
        modules,
        header: {
            ...base.header,
            progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
            continueLessonId: resumeId ?? base.header.continueLessonId,
        },
    }
}

/**
 * Loads the whole learn tree (public course detail) and overlays the viewer's
 * per-lesson completion from `GET /courses/{id}/me/progress`. Progress is a
 * separate, auth-gated call keyed on the resolved course id, so it refetches
 * after the tree resolves and fails soft for anon viewers.
 */
export const useQueryLearnCourseSwr = (courseId: string) => {
    const { data: base, isLoading, error, mutate } = useSWR(
        courseId ? ["GET_LEARN_COURSE", courseId] : null,
        async () => toLearnCourse(courseId, await getCourseDetail(courseId)),
    )
    const realId = base?.id
    const { data: progress, mutate: mutateProgress } = useSWR(
        realId ? ["GET_COURSE_PROGRESS", realId] : null,
        async () => getCourseProgress(realId as string),
        { shouldRetryOnError: false },
    )
    // The caller's own access state on this course ({enrolled, purchased, fullAccess}),
    // keyed on the resolved course UUID. Degrades to null for a guest / not-found, so
    // the trial-card + rail buy CTA read a single owned source without an extra manual
    // fetch. `GET /courses/{id}/me/access`.
    const { data: access, mutate: mutateAccess } = useGetMyCourseAccessSwr(realId)

    const data = base ? withProgress(base, progress) : undefined
    return {
        course: data,
        modules: data?.modules ?? [],
        header: data?.header,
        navSections: data?.navSections ?? [],
        /** The caller's course access state, or `null` for a guest / not-found. */
        access: (access ?? null) as CourseAccessStateView | null,
        isLoading,
        error,
        mutate: async () => {
            await Promise.all([mutate(), mutateProgress(), mutateAccess()])
        },
    }
}
