"use client"

import useSWR from "swr"
import { getCourseDetail, getMyEnrollments } from "@/modules/api/rest/course"
import type { CourseDetail as CourseDetailDto, EnrollmentView } from "@/modules/api/rest/course"
import { mapCourseLevel, type CourseLevel } from "./useQueryCoursesSwr"

/** A lesson in a course section (syllabus preview row). */
export interface CourseLesson {
    id: string
    title: string
    /** Human duration label, e.g. "8:20". */
    durationLabel: string
    /** Premium lessons unlock on enroll — shown with a lock in the pre-enroll preview. */
    isPremium?: boolean
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

/** One line item in a tier's "what's included" list. */
export interface CourseEnrollmentPlanInclude {
    /** i18n key under `courseSystem.detail.planIncludes`. */
    key: string
    /** Optional interpolation values for the i18n message. */
    params?: Record<string, string | number>
}

/** A single enrollment tier (Free / Premium) shown in the purchase card. */
export interface CourseEnrollmentPlan {
    /** i18n key for the tier name under `courseSystem.detail.planNames`. */
    name: string
    /** Optional i18n key for a badge (e.g. "Phổ biến"). */
    badge?: string
    /** Price of this tier in VND (0 for Free). */
    priceVnd: number
    /** Optional pre-discount price for this tier. */
    originalPriceVnd?: number
    /** Benefit rows rendered under the tier. */
    includes: Array<CourseEnrollmentPlanInclude>
}

/** Enrollment state of the current viewer for this course.
 *
 * ponytail: mock-only until the BE course enrollment contract lands. */
export interface CourseEnrollmentState {
    /** True when the viewer has any enrollment (free or paid). */
    isEnrolled: boolean
    /** True only for a purchased (premium) enrollment. */
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
     * PACKAGE renders the real package picker, everything else keeps the
     * legacy Free/Premium tiers.
     */
    saleMode: string
    level: CourseLevel
    credits: number
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
    /** Free and Premium enrollment tiers shown in the purchase card. Mock until BE lands. */
    plans: {
        free: CourseEnrollmentPlan
        premium: CourseEnrollmentPlan
    }
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
 * (never fabricated). Prices/plans are built from the real sale/total price and
 * the real free-vs-total lesson counts.
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
            // BE carries no per-lesson duration on the public detail.
            durationLabel: "",
            // Non-free lessons unlock on enroll — shown with a lock pre-enroll.
            isPremium: !lesson.free,
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
        plans: {
            free: {
                name: "free",
                priceVnd: 0,
                includes: [
                    ...(freeLessons > 0
                        ? [{ key: "previewLessons", params: { count: freeLessons } }]
                        : []),
                    { key: "freeChallenge" },
                ],
            },
            premium: {
                name: "premium",
                badge: "recommended",
                priceVnd,
                originalPriceVnd,
                includes: [
                    ...(totalLessons > 0
                        ? [{ key: "allLessons", params: { count: totalLessons } }]
                        : []),
                    { key: "allChallenges" },
                    { key: "certificate" },
                ],
            },
        },
        // BE has no structured outcomes / instructor / reviews → hidden sections.
        whatYouLearn: [],
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
    const course =
        data && enrollments
            ? {
                  ...data,
                  enrollment: {
                      isEnrolled: enrollments.some((e) => e.slugName === courseId && e.active),
                      // BE `EnrollmentView` carries no paid flag — nothing reads
                      // `isPurchased` today, so leave it false (unknown).
                      isPurchased: false,
                  },
              }
            : data
    return { course, isLoading, error, mutate }
}
