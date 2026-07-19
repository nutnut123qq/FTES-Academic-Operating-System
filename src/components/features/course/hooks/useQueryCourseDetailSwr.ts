"use client"

import useSWR from "swr"
import { getCourseDetail, getMyEnrollments } from "@/modules/api/rest/course"
import type { CourseDetail as CourseDetailDto, EnrollmentView } from "@/modules/api/rest/course"
import { useGetMyCourseAccessSwr } from "@/hooks/swr/api/rest/queries"
import { mapCourseLevel, type CourseLevel } from "./useQueryCoursesSwr"

/** A lesson in a course section (syllabus preview row). */
export interface CourseLesson {
    id: string
    title: string
    /** Short lesson blurb shown under the title in the syllabus outline (absent → hidden). */
    description?: string
    /** Human duration label, e.g. "8:20". */
    durationLabel: string
    /** Non-free lesson (`!free`) — drives the "Premium" tag ONLY, never the lock. */
    isPremium?: boolean
    /**
     * Locked FOR THE CURRENT VIEWER (per-viewer `LessonView.locked`): premium and not
     * yet entitled. A premium lesson the viewer already owns is `isPremium` but NOT
     * `isLocked`, so the syllabus shows it clickable (no lock). The LOCK decision must
     * use this, never `!free`.
     */
    isLocked: boolean
    /** BE per-viewer access level (FULL | PREVIEW | NONE) — carried through for callers. */
    accessLevel?: string
    /**
     * Slugs of the packages that unlock this lesson (BE-ordered lowest→highest tier).
     * `[0]` = the minimum tier and drives the syllabus tier badge; empty on LEGACY courses.
     */
    packageSlugs: string[]
}

/** A course section (chapter) grouping lessons. */
export interface CourseSection {
    id: string
    title: string
    /** Optional section blurb — rendered as "Title: description" in the outline. */
    description?: string
    lessons: Array<CourseLesson>
}

/** A single learner review. */
export interface CourseReview {
    id: string
    author: string
    /** 1–5 stars. */
    rating: number
    text: string
}

/** Course price. VND is the charged currency; USD is a reference figure. */
export interface CoursePrice {
    vnd: number
    usd: number
    /** Pre-discount VND — struck through by {@link PriceTag} when greater than `vnd`. */
    originalVnd?: number
}

/** Enrollment state of the current viewer for this course.
 *
 * Resolved from the real BE contract: `EnrollmentView.isPurchased` on the
 * viewer's `me/enrollments` row, with `me/access` as the fallback when a package
 * purchase grants access without a matching enrollment row. */
export interface CourseEnrollmentState {
    /** True when the viewer has any active enrollment (free or paid). */
    isEnrolled: boolean
    /** True only for a purchased (premium/package) enrollment. */
    isPurchased: boolean
}

/** A single instructor credential or achievement line. */
export interface CourseInstructorAchievement {
    id: string
    /** Phosphor icon key mapped to an icon component in the UI. */
    icon: string
    text: string
}

/** Instructor headline stats. */
export interface CourseInstructorStats {
    /** Number of courses taught. */
    courses: number
    /** Total learners across all courses. */
    students: number
    /** Average rating (0–5). */
    rating: number
}

/** Optional instructor social / contact links. */
export interface CourseInstructorLinks {
    github?: string
    linkedin?: string
    website?: string
}

/** The course instructor identity shown on the detail page. */
export interface CourseInstructor {
    name: string
    /** Formal title, e.g. "Giảng viên Kỹ thuật phần mềm". */
    title: string
    /** Display role line, e.g. degree + affiliation. */
    role: string
    bio: string
    /** Uploaded avatar URL; empty → fallback to generated avatar / initials. */
    avatarUrl?: string
    stats: CourseInstructorStats
    achievements: Array<CourseInstructorAchievement>
    links?: CourseInstructorLinks
}

/** Full course detail (§4, mock until BE lands). */
export interface CourseDetail {
    id: string
    /** The BE course UUID (routing id above is the slug) — used to resolve the commerce product. */
    rawId: string
    code: string
    name: string
    /**
     * BE sale mode, upper-cased: `"PACKAGE"` (the course sells N distinct
     * packages, each its own COURSE_UNLOCK product) or `"LEGACY"` (single
     * enroll/buy). Empty when the BE detail omits it. Drives the enroll card:
     * PACKAGE renders the real package picker, everything else renders the
     * single "whole course" option.
     */
    saleMode: string
    level: CourseLevel
    credits: number
    /** Course cover image (BE `imageHeader`) — absent → the card shows a placeholder. */
    coverUrl?: string
    description: string
    /** Total learning-time label, e.g. "6 giờ". */
    durationLabel: string
    /** Numeric total learning hours — optional until the BE course contract lands. */
    durationHours?: number
    price: CoursePrice
    rating: { avg: number; count: number }
    /** Total learners enrolled — optional until the BE course contract lands. */
    enrollmentCount?: number
    /** Total challenges in the course — optional until the BE course contract lands. */
    challengeCount?: number
    /** Enrollment state of the current viewer. Optional / mock until BE lands. */
    enrollment?: CourseEnrollmentState
    /** Total lessons across every section — the enroll card's "N bài học" benefit row. */
    lessonCount: number
    /** Lessons flagged `free` by the BE — gates the "Học thử miễn phí" entry point. */
    freeLessonCount: number
    whatYouLearn: Array<string>
    /** Instructor identity. Absent when the BE detail carries no instructor → the card hides. */
    instructor?: CourseInstructor
    sections: Array<CourseSection>
    reviews: Array<CourseReview>
}

/**
 * Adapts the BE `CourseDetail` DTO into the detail-page {@link CourseDetail}
 * model. The BE detail carries real course meta, description and a full
 * section/lesson syllabus, but has NO instructor, reviews, structured
 * "what you'll learn", credits or duration — those degrade to hidden sections
 * (never fabricated). The price comes from the real sale/total price and the
 * lesson counts from the real free-vs-total lessons.
 *
 * @param dto - The BE public course detail.
 * @returns The detail-page model.
 */
const toCourseDetail = (dto: CourseDetailDto): CourseDetail => {
    const course = dto.course
    const sections: Array<CourseSection> = (dto.sections ?? []).map((section) => ({
        id: section.id,
        title: section.name,
        description: section.description?.trim() ? section.description.trim() : undefined,
        lessons: (section.lessons ?? []).map((lesson) => ({
            id: lesson.id,
            title: lesson.name,
            description: lesson.description?.trim() ? lesson.description.trim() : undefined,
            // BE carries no per-lesson duration on the public detail.
            durationLabel: "",
            // `!free` is the "Premium" TAG only — never the lock (an enrolled viewer
            // owns premium lessons: free=false but locked=false).
            isPremium: !lesson.free,
            // Per-viewer lock from the enrollment-aware BE detail — the ONLY lock signal.
            isLocked: lesson.locked === true,
            accessLevel: lesson.accessLevel ?? undefined,
            packageSlugs: lesson.packageSlugs ?? [],
        })),
    }))
    const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0)
    const freeLessons = (dto.sections ?? []).reduce(
        (sum, section) => sum + (section.lessons ?? []).filter((lesson) => lesson.free).length,
        0,
    )
    const sale = Number(course.salePrice)
    const total = Number(course.totalPrice)
    const priceVnd =
        Number.isFinite(sale) && sale > 0
            ? sale
            : Number.isFinite(total) && total > 0
                ? total
                : 0
    const originalPriceVnd = Number.isFinite(total) && total > priceVnd ? total : undefined
    const star = Number(course.avgStar)

    return {
        id: course.slugName,
        rawId: course.id,
        code: course.courseCode,
        name: course.title,
        // Normalise to upper-case so the enroll card can compare against "PACKAGE"
        // without re-casing at every call site.
        saleMode: (course.saleMode ?? "").toUpperCase(),
        level: mapCourseLevel(course.level),
        // BE detail carries no credits/duration — hidden by the view when absent/zero.
        credits: 0,
        coverUrl: course.imageHeader || undefined,
        description: dto.description ?? "",
        durationLabel: "",
        durationHours: undefined,
        price: { vnd: priceVnd, usd: 0, originalVnd: originalPriceVnd },
        // Real aggregate: avg star + rating count from the BE CourseSummary.
        rating: { avg: Number.isFinite(star) ? star : 0, count: course.ratingCount ?? 0 },
        enrollmentCount: course.totalUser ?? undefined,
        challengeCount: undefined,
        // Viewer enrollment state is a separate contract — default to the sales card.
        enrollment: { isEnrolled: false, isPurchased: false },
        lessonCount: totalLessons,
        freeLessonCount: freeLessons,
        // "What you'll learn" = the BE's key topics (`contentCourse`, a
        // comma-joined string) — the same source the hover preview reads.
        // ponytail: split on comma, no NLP. Empty string → [] hides the section.
        whatYouLearn: (dto.contentCourse ?? "")
            .split(",")
            .map((topic) => topic.trim())
            .filter(Boolean),
        instructor: undefined,
        sections,
        reviews: [],
    }
}

/**
 * Loads a course's public detail from `GET /api/v1/courses/{slugName}` and
 * adapts it to the detail-page model. Keyed on the slug; disabled until a slug
 * is present. `course` stays `undefined` while loading / on error.
 *
 * @param courseId - The course `slugName` from the `[courseId]` route param.
 */
export const useQueryCourseDetailSwr = (courseId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        courseId ? ["course-detail", courseId] : null,
        () => getCourseDetail(courseId).then(toCourseDetail),
    )
    // Real viewer enrollment: mark this course enrolled when it appears in the
    // viewer's active enrollments (`GET /courses/me/enrollments`). Auth-gated —
    // anon or a 401 degrades silently to the sales card.
    const hasToken =
        typeof window !== "undefined" &&
        !!window.localStorage.getItem("keycloak:access_token")
    const { data: enrollments } = useSWR(
        hasToken && courseId ? ["my-enrollments", courseId] : null,
        () => getMyEnrollments().catch(() => [] as Array<EnrollmentView>),
    )
    // The viewer's active enrollment for THIS course, if any. It carries the real
    // paid flag (`EnrollmentView.isPurchased`) straight from the BE, so an
    // enrolled viewer needs no extra call.
    const matched = enrollments?.find((e) => e.slugName === courseId && e.active)
    // Fallback: a viewer who bought a package can hold FULL access without an
    // active enrollment row in `me/enrollments`. When signed in, the detail has
    // loaded (we need the course UUID for the path), and no enrollment matched,
    // ask `GET /courses/{rawId}/me/access` to recover `purchased`/`enrolled`.
    const needAccessFallback =
        hasToken && enrollments !== undefined && !matched
    const { data: access } = useGetMyCourseAccessSwr(
        needAccessFallback ? data?.rawId : undefined,
    )
    const course =
        data && enrollments
            ? {
                  ...data,
                  enrollment: {
                      isEnrolled: !!matched || access?.enrolled === true,
                      // Real paid flag: from the matched enrollment, else the
                      // access-state fallback. Anonymous / neither → false.
                      isPurchased:
                          matched?.isPurchased === true || access?.purchased === true,
                  },
              }
            : data
    return { course, isLoading, error, mutate }
}
